import Feature from './feature.js';
import * as util from './util.js';



var defaultConvert = data => {
    return data;
}

var getConvert = (name, process) => {
    var convert = process.getIAxiosOptionItem('handlers.' + name);
    convert = typeof convert === 'function' ? defaultConvert : convert;
    return convert;
}

export default class Process {
    constructor() {
        this.stack = [];
        this.iaxios = null;
        this.otherOptions = null;
        this.requestName = '';
        this.requestArgs = null;
        this.isCancel = false;
        this.dataMap = [];
        this.cancelToken = null;
    }

    run() {
        //执行run函数后，即锁定当前配置中的Feature，解释后续再有功能的配置变化，也不会执行，函数除外
        var process = this;

        function CancelPromise(executor) {
            var p = new Promise(function (resolve, reject) {
                // before
                return executor(resolve, reject);
            });
            // after
            p.__proto__ = CancelPromise.prototype;
            return p;
        }
        CancelPromise.__proto__ = Promise;
        CancelPromise.prototype.__proto__ = Promise.prototype;
        CancelPromise.prototype.cancel = function (data) {
            return process.cancel(data);
        }


        var promise = new CancelPromise((resolve, reject) => {
            var orgFeatures = process.getIAxiosOptionItem('features');
            var keys = Object.keys(orgFeatures).filter(name => {
                var f = orgFeatures[name];
                return !!f.enabled;//只抓取已启用的功能
            });
            var features = keys.map(name => {
                return Feature.map[name];
            }).filter(f => {
                return !!f;
            });
            features.push(Feature.map['sender']);
            features = features.filter(f => f.stage === 'before').concat(features.filter(f => f.stage === 'sending'), features.filter(f => f.stage === 'after'))

            //将功能实例赋值到process上
            process.featureInstances = features;
            process.featureOptions = orgFeatures;


            features.forEach(featureIns => {
                process.use(function (next) {
                    if (process.isCancel) {
                        reject(getConvert('rejectConvert', process)(process.dataMap, process.getIAxiosOptionItem(`requestConfigList['${process.requestName}']`)));
                        return;
                    }

                    featureIns.exec(process).then(data => {
                        process.dataMap.push(data);
                        if (data.state === 'resolve') {
                            if (featureIns.requiredResolve) {
                                if (typeof featureIns.breforeResolve === 'function') {
                                    featureIns.breforeResolve(process);
                                }
                                resolve(getConvert('resolveConvert', process)(data.data, process.getIAxiosOptionItem(`requestConfigList['${process.requestName}']`)));
                            } else {
                                if (process.stack.length > 0) {
                                    next();
                                } else {
                                    resolve(getConvert('resolveConvert', process)(data.data, process.getIAxiosOptionItem(`requestConfigList['${process.requestName}']`)));
                                }
                            }
                        } else {
                            if (typeof featureIns.beforeReject === 'function') {
                                featureIns.beforeReject(process);
                            }
                            reject(getConvert('rejectConvert', process)(process.dataMap, process.getIAxiosOptionItem(`requestConfigList['${process.requestName}']`)));
                        }
                    });
                })
            });
            process.next();
        });
        return promise;
    }

    cancel(data) {
        if (this.isCancel) return;
        this.isCancel = true;
        if (this.cancelToken) {
            this.cancelToken.cancel(data);
        }
    }

    getIAxiosOptionItem(propExp) {
        var configProp = `requestConfigList['${this.requestName}']`,
            sendOptions = this.requestArgs.length > 1 ? this.requestArgs[this.requestArgs.length - 1] : undefined,
            otherOptions = this.otherOptions;
        if (configProp == propExp) {
            return this.iaxios.getOptionItem(propExp, sendOptions, otherOptions);
        } else {
            var requestConfig = this.getIAxiosOptionItem(configProp),
                standardConfig = util.standardRequestConfigItem(requestConfig);
            return this.iaxios.getOptionItem.call(this.iaxios, propExp, sendOptions, otherOptions, typeof standardConfig === 'object' ? standardConfig : undefined);
        }
    }

    use(handler) {
        if (typeof handler !== 'function') return;
        this.stack.push(handler);
    }

    next() {
        var item = this.stack.shift();
        if (item) {
            item(this.next.bind(this));
        }
    }
}
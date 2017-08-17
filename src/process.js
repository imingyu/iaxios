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
        var promise = new Promise((resolve, reject) => {
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
                        reject(getConvert('rejectConvert', process)(process.dataMap));
                        return;
                    }

                    featureIns.exec(process).then(data => {
                        process.dataMap.push(data);
                        if (data.state === 'resolve') {
                            if (featureIns.requiredResolve) {
                                if (typeof featureIns.breforeResolve === 'function') {
                                    featureIns.breforeResolve(process);
                                }
                                resolve(getConvert('resolveConvert', process)(data.data));
                            } else {
                                if (process.stack.length > 0) {
                                    next();
                                } else {
                                    resolve(getConvert('resolveConvert', process)(data.data));
                                }
                            }
                        } else {
                            if (typeof featureIns.beforeReject === 'function') {
                                featureIns.beforeReject(process);
                            }
                            reject(getConvert('rejectConvert', process)(process.dataMap));
                        }
                    });
                })
            });
            process.next();
        });
        promise.cancel = function (data) {
            if (process.isCancel) return;
            process.isCancel = true;
            var obj = {
                stage: 'cancel',
                state: 'reject',
                data: data
            };
            process.dataMap.push(obj);
            if (process.cancelToken) {
                process.cancelToken.cancel();
            }
        };
        return promise;
    }

    getIAxiosOptionItem(propExp) {
        var configProp = `requestConfigList['${this.requestName}']`,
            sendOptions = this.requestArgs.length > 1 ? this.requestArgs[this.requestArgs.length - 1] : undefined,
            otherOptions = this.otherOptions;
        if (configProp == propExp) {
            return this.iaxios.getOptionItem(propExp, sendOptions, otherOptions);
        } else {
            var requestConfig = this.getIAxiosOptionItem(`requestConfigList['${this.requestName}']`),
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
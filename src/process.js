import Feature from './feature.js';
import * as util from './util.js';

var defaultConvert = data => {
    return data;
}

var getConvert = (name, process) => {
    var handlers = process.computeOptions.handlers,
        convert = handlers ? handlers[name] : null;
    convert = typeof convert === 'function' ? convert : defaultConvert;
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
        process.requestItemConfig = process.iaxios.options.requestConfigList[process.requestName];
        process.computeOptions = util.extend(true, {}, process.iaxios.options, util.standardRequestConfigItem(process.requestItemConfig), process.otherOptions, process.sendOptions);

        function CancelPromise(executor) {
            var p = new Promise(function (resolve, reject) {
                return executor(resolve, reject);
            });
            /*eslint no-proto: 0*/
            p.__proto__ = CancelPromise.prototype;
            return p;
        }
        CancelPromise.__proto__ = Promise;
        CancelPromise.prototype.__proto__ = Promise.prototype;
        CancelPromise.prototype.cancel = function (data) {
            return process.cancel(data);
        }

        var promise = new CancelPromise((resolve, reject) => {
            var orgFeatures = process.computeOptions.features;
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
                        reject(getConvert('rejectConvert', process)(process.dataMap, process.requestItemConfig));
                        return;
                    }

                    featureIns.exec(process).then(data => {
                        process.dataMap.push(data);
                        if (data.state === 'resolve') {
                            if (featureIns.requiredResolve) {
                                if (typeof featureIns.breforeResolve === 'function') {
                                    featureIns.breforeResolve(process);
                                }
                                resolve(getConvert('resolveConvert', process)(data.data, process.requestItemConfig));
                            } else {
                                if (process.stack.length > 0) {
                                    next();
                                } else {
                                    resolve(getConvert('resolveConvert', process)(data.data, process.requestItemConfig));
                                }
                            }
                        } else {
                            if (typeof featureIns.beforeReject === 'function') {
                                featureIns.beforeReject(process);
                            }
                            reject(getConvert('rejectConvert', process)(process.dataMap, process.requestItemConfig));
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

import axios from 'axios';
import Feature from './feature.js';
import Process from './process.js';
import * as util from './util.js';
import { iaxios as defaultIAxiosOptions, request as defaultRequestConfig } from './options.js';


const featureSender = new Feature('sender', 'sending', function (iaxiosIns, requestConfig, requestArgs, cancelTigger) {
    var options = util.extend(true, {}, this.options, otherOptions || {}, ops || {});
    var promise = new Promise((resolve, reject) => {
        var self = this,
            axios = this.axios,
            options = util.extend(true, {}, this.options, ops || {}),
            handlers = options.handlers || {},
            features = options.features || {},
            configList = options.requestConfigList,
            cancelToken = axios.CancelToken.source();

        //获取真实url
        options.url = url;
        if (typeof handlers.getUrl === 'function') {
            var computedUrl = handlers.getUrl(options);
            if (computedUrl) {
                options.url = computedUrl + "";
            }
        }

        //开始发送请求
        this.axios.request(options).then(res => {
            if (handlers.checkResult(res)) {
                resolve(handlers.resolveConvert(res))
            } else {
                reject(handlers.rejectConvert(res, null));
            }
        }).catch(error => {
            if (axios.isCancel(error)) {
                reject(handlers.cancelConvert(null, error));
            } else {
                reject(handlers.rejectConvert(null, error));
            }
        });

        //为外部promise赋值cancel函数，用于取消正在发送的request
        promise.cancel = function (data) {
            cancelToken.cancel(data);
        }
    });
});


/**
 * request发送流程：
 * 1.检查认证：auth
 * 2.验证参数：validator
 * 3.获取请求的真实url：getUrl
 * 4.应用计算后的axios配置信息：axios.request
 * 5.开始发送请求
 * 6.检查请求结果：checkResult
 * 7.格式化请求结果数据：成功：resolveConvert，失败：rejectConvert，取消：cancelConvert，未认证：unAuthConvert
 * 8.将处理的数据传递给后续函数处理：then/catch
 * 9.流程结束
 */

class IAxios {
    constructor(ops) {
        this.id = (Math.random() + "").replace('0.', '');

        //功能实例
        this.featuresIns = {};

        this.options = {};
        this.options(defaultIAxiosOptions);
        this.options(ops);
        //this._updateOptions = false;//标志是否调用了this.options(ops)方法，因为有时request还未发出去，但是已经创建好了，这是要在发送前判断下_updateOptions，如果需要更新，就会重新抓取一遍options

        //创建一个axios实例
        this.axios = axios.create(this.options.axios || {});
    }
    createRequest(requestName, otherOptions) {
        var iaxiosIns = this;

        return function request(model, ops) {
            var requestArgs = Array.from(arguments),
                process = new Process(),

                computeOptions = () => {
                    var options = iaxiosIns.computeOptions(),
                        requestConfig = util(true, {}, options.requestConfigList[requestName]);

                    if (!requestConfig) return;

                    util.extend(true, options.features, requestConfig.features || {});
                    delete requestConfig.features;
                    util.extend(true, options.handlers, requestConfig.handlers || {});
                    delete requestConfig.handlers;
                    util.extend(true, options.axios, requestConfig);
                    if (otherOptions) util.extend(true, options, otherOptions);
                    if (requestArgs.length > 1 && typeof requestArgs[1] === 'object') {
                        util.extend(true, options, requestArgs[1]);
                    }
                    return {
                        options: options,
                        requestConfig: requestConfig
                    };
                };
            process.iaxios = iaxiosIns;


            var promise = new Promise((resolve, reject) => {
                process.use(function (next) {
                    var ops = computeOptions();
                    if (ops && ops.options.features && ops.options.features.auth) {
                        self.featuresIns.auth.exec().then(data => {
                            //if(data.state=='')
                        });
                    } else {
                        next();
                    }
                });
                process.use(function (next) {
                    var ops = computeOptions();
                    if (ops && ops.options.features && ops.options.features.validator) {
                        self.featuresIns.validator.exec()
                    } else {
                        next();
                    }
                });
                queue.push(featureSender);
            });
            promise.cancel = function (data) {
            };

            return promise;
        }
    }
    options(ops) {
        if (typeof ops === 'object') {
            this.options = util.extend(true, {}, defaultIAxiosOptions, this.options, ops);
            util.extend(true, this.axios.defaults, this.options.axios || {});

            var self = this;
            Object.keys(this.options.features).forEach(key => {
                var fe = Feature.map[key];
                if (fe) {
                    self.featuresIns[key] = Feature.map[key];
                } else {
                    self.log(`[IAxios]不存在名称是 ${key} 的Feature;`);
                }
            });
        }
    }
    computeOptions() {
        var args = Array.from(arguments);
        return util.extend.apply(null, [true, {}, defaultIAxiosOptions].concat(args));
    }
    log(msg) {
        if (this.options.features && this.options.features.tip) {
            (this.options.handlers.logTip || console.warn)(msg);
        }
    }

    static create(ops) {
        return new IAxios(ops);
    }
    static createRequest(requestName, otherOptions) {
        return IAxios.map['default'].createRequest(requestName, otherOptions);
    }
    static options(ops) {
        if (typeof ops === 'object') {
            util.extend(true, defaultIAxiosOptions, ops);
        }
    }
}
IAxios.map = {};

var defaultIAxios = IAxios.create();
defaultIAxios.id = "default";
IAxios.map['default'] = defaultIAxios;

export default {
    create: IAxios.create,
    createRequest: IAxios.createRequest,
    options: IAxios.options
}
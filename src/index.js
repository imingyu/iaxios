import { version } from '../package.json';
import axios from 'axios';
import Feature from './feature.js';
import Process from './process.js';
import * as util from './util.js';
import defaultIAxiosOptions from './options.js';

var CancelToken = axios.CancelToken;


const featureSender = new Feature('sender', 'sending', function (process) {
    console.log(process);
    var options = process.computedOptions.options || {},
        iaxios = process.iaxios,
        axios = iaxios.axios,
        requestName = process.requestName;
    var handlers = options.handlers || {},
        features = options.features || {},
        configList = options.requestConfigList,
        cancelTokenSource = CancelToken.source();
    process.cancelToken = cancelTokenSource;

    //3.获取请求的真实url：getUrl
    if (typeof handlers.getUrl === 'function') {
        var computedUrl = handlers.getUrl(process.computedOptions.requestConfig);
        if (computedUrl) {
            options.axios.url = computedUrl + "";
        }
    }

    featureSender.checker = function (res) {
        return (process.computedOptions.options.handlers.checkResult || function () { return true })(res);
    }

    //4.应用计算后的axios配置信息：axios.request 
    options.axios.cancelToken = cancelTokenSource.token;
    var requestModel = process.requestArgs && process.requestArgs.length > 0 ? process.requestArgs[0] : {};
    if (options.axios.method === 'get') {
        options.axios.params = options.axios.params || {};
        if (typeof options.axios.params === 'object') {
            util.extend(true, options.axios.params, requestModel);
        } else if (typeof options.axios.params === 'string') {
            options.axios.params += '&' + util.paramsSerializer(requestModel);
        }
    } else {
        options.axios.data = options.axios.data || {};
        if (typeof options.axios.data === 'object') {
            util.extend(true, options.axios.data, requestModel);
        } else if (typeof options.axios.data === 'string') {
            options.axios.data += '&' + util.stringifyData(requestModel);
        }
    }

    //5.开始发送请求
    return axios.request(options.axios);
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
        IAxios.map[id] = this;

        //创建一个axios实例
        this.axios = axios.create();

        this.options = {};
        this.setOptions(ops);
    }
    createRequest(requestName, otherOptions) {
        var iaxiosIns = this;

        return function request(model, ops) {
            var requestArgs = Array.from(arguments),
                process = new Process(),
                computeOptions = () => {
                    var options = util.extend(true, {}, defaultIAxiosOptions, iaxiosIns.options),
                        requestConfig = options.requestConfigList[requestName];

                    if (!requestConfig) return;

                    var copyRequestConfig = util.extend(true, {}, requestConfig);

                    util.extend(true, options.features, copyRequestConfig.features || {});
                    delete copyRequestConfig.features;
                    util.extend(true, options.handlers, copyRequestConfig.handlers || {});
                    delete copyRequestConfig.handlers;
                    util.extend(true, options.axios, copyRequestConfig);

                    if (otherOptions) util.extend(true, options, otherOptions);
                    if (requestArgs.length > 1 && typeof requestArgs[1] === 'object') {
                        util.extend(true, options, requestArgs[1]);
                    }

                    var checkResult = options.handlers.checkResult,
                        resolveConvert = options.handlers.resolveConvert,
                        rejectConvert = options.handlers.rejectConvert;

                    return {
                        options: options,
                        requestConfig: requestConfig,
                        checkResult: checkResult,
                        resolveConvert: resolveConvert,
                        rejectConvert: rejectConvert
                    };
                },
                checkCancel = function (reject) {
                    if (process.isCancel) {
                        reject(rejectConvert(process.dataMap));
                        return true;
                    }
                }
            process.iaxios = iaxiosIns;
            process.requestName = requestName;
            process.requestArgs = requestArgs;
            process.isCancel = false;
            process.dataMap = [];
            process.cancelToken = null;


            var promise = new Promise((resolve, reject) => {
                process.computedOptions = computeOptions();


                //1.检查认证：auth
                process.use(function (next) {
                    var ops = computeOptions();
                    process.computedOptions = ops;

                    if (process.isCancel) {
                        reject(ops.rejectConvert(process.dataMap));
                        return;
                    }

                    if (ops && ops.options.features && ops.options.features.auth) {
                        Feature.map.auth.exec(process).then(data => {
                            process.dataMap.push(data);
                            if (data.state === 'resolve') {
                                next();
                            } else {
                                if (typeof ops.options.features.auth === 'object' && typeof ops.options.features.auth.onUnAuth === 'function') {
                                    ops.options.features.auth.onUnAuth(ops.requestConfig, requestArgs);
                                }
                                reject(ops.rejectConvert(process.dataMap));
                            }
                        });
                    } else {
                        next();
                    }
                });
                //2.验证参数：validator
                process.use(function (next) {
                    var ops = computeOptions();
                    process.computedOptions = ops;

                    if (process.isCancel) {
                        reject(ops.rejectConvert(process.dataMap));
                        return;
                    }
                    if (ops && ops.options.features && ops.options.features.validator) {
                        Feature.map.validator.exec(process).then(data => {
                            process.dataMap.push(data);
                            if (data.state === 'resolve') {
                                next();
                            } else {
                                reject(ops.rejectConvert(process.dataMap));
                            }
                        });
                    } else {
                        next();
                    }
                });
                process.use(function (next) {
                    var ops = computeOptions();
                    process.computedOptions = ops;

                    if (process.isCancel) {
                        reject(ops.rejectConvert(process.dataMap));
                        return;
                    }
                    featureSender.exec(process).then(data => {
                        process.dataMap.push(data);
                        if (data.state === 'resolve') {
                            resolve(ops.resolveConvert(data));
                        } else {
                            reject(ops.rejectConvert(process.dataMap));
                        }
                    });
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
    }
    setOptions(ops) {
        if (typeof ops === 'object') {
            util.extend(true, this.options, ops);
            util.extend(true, this.axios.defaults, this.options.axios || {});
        }
    }
    log(msg) {
        if (this.options.features && this.options.features.tip) {
            (typeof this.options.features.tip === 'function' ? this.options.features.tip : console.warn)(msg);
        }
    }

    static create(ops) {
        return new IAxios(ops);
    }
    static createRequest(requestName, otherOptions) {
        return IAxios.map['default'].createRequest(requestName, otherOptions);
    }
    static setOptions(ops) {
        if (typeof ops === 'object') {
            util.extend(true, defaultIAxiosOptions, ops);
            IAxios.map['default'].setOptions(ops);
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
    setOptions: IAxios.setOptions,
    version: version
}
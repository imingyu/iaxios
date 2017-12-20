import axios from 'axios';
import * as util from './util.js';

const stages = ['before', 'sending', 'after'];

var check = (feature, checkData, resolve, process) => {
    var checkResult = feature.checker(checkData, process),
        stage = `${feature.stage}.${feature.name}`;
    if (util.isPromise(checkResult)) {
        checkResult.then(result => {
            resolve({
                state: result ? 'resolve' : 'reject',
                stage: stage,
                data: checkData
            });
        }).catch(() => {
            resolve({
                state: 'reject',
                stage: stage,
                data: checkData
            });
        })
    } else {
        resolve({
            state: checkResult ? 'resolve' : 'reject',
            stage: stage,
            data: checkData
        });
    }
}

class Feature {
    constructor(name, stage, handler, checker, beforeReject) {
        stage = stage || '';
        stage = stage.toLowerCase();
        this.name = name;
        this.stage = stages.indexOf(stage) != -1 ? stage : 'before';
        this.handler = handler;
        this.checker = typeof checker === 'function' ? checker : function (result) {
            return result;
        };
        this.beforeReject = typeof beforeReject === 'function' ? beforeReject : function () { };
    }

    exec(process) {
        var self = this,
            args = Array.from(arguments);
        return new Promise((resolve, reject) => {
            var result = self.handler.apply(self, args),
                stage = `${self.stage}.${self.name}`;
            if (util.isPromise(result)) {
                result.then(data => {
                    check(self, data, resolve, process);
                }).catch(error => {
                    if (axios.isCancel(error)) {
                        stage = 'cancel';
                    }
                    resolve({
                        state: 'reject',
                        stage: stage,
                        data: error
                    });
                })
            } else {
                check(self, result, resolve, process);
            }
        });
    }
}

Feature.map = {};

//认证功能
Feature.map['auth'] = new Feature('auth', 'before', function (process) {
    var authOps = process.featureOptions.auth;
    if (authOps && typeof authOps.handler === 'function') {
        return authOps.handler(process.requestItemConfig, process.requestArgs);
    } else {
        return true;
    }
}, null, function (process) {
    var authOps = process.featureOptions.auth;
    if (typeof authOps.onUnAuth === 'function') {
        authOps.onUnAuth(process.requestItemConfig, process.requestArgs);
    }
});

//validator功能
var validatorFeature = new Feature('validator', 'before', function (process) {
    var requestConfig = process.requestItemConfig,
        vsAll = process.computeOptions.validators || {},
        vsConfig = process.featureOptions.validator,
        vsRequest = vsAll[process.requestName], //request对应的验证器
        execValidators = [];

    if (typeof vsRequest === 'function') {
        execValidators.push(vsRequest)
    } else if (Array.isArray(vsRequest)) {
        execValidators = execValidators.concat(vsRequest);
    }
    if (typeof vsConfig === 'function') {
        execValidators.push(vsConfig)
    } else if (Array.isArray(vsConfig)) {
        execValidators = execValidators.concat(vsConfig);
    } else if (typeof vsConfig === 'object' && vsConfig.enabled && vsConfig.validators) {
        execValidators = execValidators.concat(vsConfig.validators || []);
    }

    return Promise.all(execValidators.map(item => {
        var itemResult = item(requestConfig, process.requestArgs);
        if (util.isPromise(itemResult)) {
            return itemResult;
        } else {
            return Promise.resolve(itemResult);
        }
    }));
}, function (datas, process) {
    var vsConfig = process.featureOptions.validator,
        checkHanlder = vsConfig.checkHanlder;
    if (typeof checkHanlder === 'function') {
        return checkHanlder(datas);
    } else {
        return true;
    }
}, function (process) {
    var vsConfig = process.featureOptions.validator,
        onUnValid = vsConfig.onUnValid;
    if (typeof onUnValid === 'function') {
        var validatorData = process.dataMap.find(item => item.stage === 'before.validator');
        return onUnValid(validatorData ? validatorData.data : undefined);
    }
});
Feature.map[validatorFeature.name] = validatorFeature;

var serialiarParams = (handler, params, data, model) => {
    if (util.isObject(params)) {
        var dataStr = '';
        if (util.isObject(data)) {
            util.extend(true, params, data);
        } else if (util.isString(data) && data.trim() != '') {
            dataStr = handler(data);
        }

        var modelStr = '';
        if (util.isObject(model)) {
            util.extend(true, params, model);
        } else if (util.isString(model) && model.trim() != '') {
            dataStr = handler(model);
        }

        if (!dataStr && !modelStr) {
        } else {
            params = handler(params);
            if (dataStr) {
                params += '&' + dataStr;
            }
            if (modelStr) {
                params += '&' + modelStr;
            }
        }
    } else if (util.isString(params)) {
        var dataStr = '';
        if (util.isObject(data) && util.isObject(model)) {
            dataStr = handler(util.extend(true, {}, data, model));
        } else if (util.isObject(data) && util.isString(model)) {
            dataStr = handler(data);
            if (model && model.trim() !== '') {
                dataStr += '&' + handler(model);
            }
        } else if (util.isString(data) && util.isObject(model)) {
            dataStr = handler(model);
            if (data && data.trim() !== '') {
                dataStr = handler(data) + '&' + dataStr;
            }
        } else if (util.isString(data) && util.isString(model)) {
            if (data && data.trim() !== '') {
                dataStr += '&' + handler(data);
            }
            if (model && model.trim() !== '') {
                dataStr += '&' + handler(model);
            }
        }

        if (dataStr) {
            params += '&' + dataStr;
        }
    } else {
        var dataStr = '';
        if (util.isObject(data) && util.isObject(model)) {
            dataStr = handler(util.extend(true, {}, data, model));
        } else if (util.isObject(data) && util.isString(model)) {
            dataStr = handler(data);
            if (model && model.trim() !== '') {
                dataStr += '&' + handler(model);
            }
        } else if (util.isString(data) && util.isObject(model)) {
            dataStr = handler(model);
            if (data && data.trim() !== '') {
                dataStr = handler(data) + '&' + dataStr;
            }
        } else if (util.isString(data) && util.isString(model)) {
            if (data && data.trim() !== '') {
                dataStr += '&' + handler(data);
            }
            if (model && model.trim() !== '') {
                dataStr += '&' + handler(model);
            }
        } else if (util.isObject(data)) {
            dataStr = data;
        } else if (util.isString(data)) {
            dataStr = handler(data);
        } else if (util.isObject(model)) {
            dataStr = model;
        } else if (util.isString(model)) {
            dataStr = handler(model);
        }

        if (dataStr) {
            params = dataStr;
        }
    }
    return params;
}

var serialiarData = (handler, data, model) => {
    var dataStr = '';
    if (util.isObject(data) && util.isObject(model)) {
        return util.extend(true, {}, data, model);
    } else if (util.isObject(data) && util.isString(model)) {
        dataStr = handler(data);
        if (model && model.trim() !== '') {
            dataStr += '&' + handler(model);
        }
        return dataStr;
    } else if (util.isString(data) && util.isObject(model)) {
        dataStr = handler(model);
        if (data && data.trim() !== '') {
            dataStr = handler(data) + '&' + dataStr;
        }
        return dataStr;
    } else if (util.isString(data) && util.isString(model)) {
        if (data && data.trim() !== '') {
            dataStr += '&' + handler(data);
        }
        if (model && model.trim() !== '') {
            dataStr += '&' + handler(model);
        }
        return dataStr;
    } else if (util.isObject(data)) {
        return data;
    } else if (util.isString(data)) {
        return data;
    } else if (util.isObject(model)) {
        return model;
    } else if (util.isString(model)) {
        return model;
    } else {
        return {}
    }
}

var requestDataHandler = (methodType, ajaxOptions, requestModel, paramsSerializer, stringifyData) => {
    if (methodType === 'get') {
        ajaxOptions.params = serialiarParams(paramsSerializer, ajaxOptions.params, ajaxOptions.data, requestModel);
    } else {
        ajaxOptions.data = serialiarData((data) => {
            return stringifyData(data, {});
        }, ajaxOptions.data, requestModel);
    }
}

//发送请求功能
const senderFeature = new Feature('sender', 'sending', function (process) {
    var iaxios = process.iaxios,
        requestName = process.requestName,
        requestConfig = process.requestItemConfig,
        ajaxOptions = process.computeOptions.axios,
        handlers = process.computeOptions.handlers,
        requestModel = process.requestArgs && process.requestArgs.length > 0 ? process.requestArgs[0] : {};

    //覆盖序列化配置
    var paramsSerializer = ajaxOptions.paramsSerializer || util.paramsSerializer;
    ajaxOptions.paramsSerializer = paramsSerializer;
    var transformRequest = Array.isArray(ajaxOptions.transformRequest) ? ajaxOptions.transformRequest : [function (data) {
        return util.stringifyData(data);
    }]
    ajaxOptions.transformRequest = transformRequest;
    var stringifyData = transformRequest[0] || function (data) {
        return util.stringifyData(data);
    };
    ajaxOptions.transformRequest[0] = stringifyData;

    //3.获取请求的真实url：getUrl
    if (typeof handlers.getUrl === 'function') {
        var computedUrl = handlers.getUrl(requestConfig);
        if (computedUrl) {
            ajaxOptions.url = computedUrl + '';
        } else {
            ajaxOptions.url = requestConfig.url;
        }
    }
    if (!ajaxOptions.url || String.prototype.trim.call(ajaxOptions.url) === '') {
        ajaxOptions.url = requestName + '';
    }
    //格式化url
    var featureFormartUrl = process.computeOptions.features.formatUrl;
    var urlFormater = featureFormartUrl.formater || util.formatString;
    var getFormatItems = featureFormartUrl.getFormatItems || util.getFormatItems;
    var formatItems = getFormatItems(ajaxOptions.url);
    if (featureFormartUrl.enabled && formatItems.length > 0) {
        var params = util.isObject(ajaxOptions.params) ? ajaxOptions.params : {},
            data = util.isObject(ajaxOptions.data) ? ajaxOptions.data : {},
            model = util.isObject(requestModel) ? requestModel : {};

        var values = util.extend(true, {},
            params,
            data,
            model
        );
        ajaxOptions.url = urlFormater(ajaxOptions.url, values);

        //是否需要移除format items
        if (featureFormartUrl.removeFormatedItem) {
            if (Array.isArray(featureFormartUrl.removeFormatedItem) && featureFormartUrl.removeFormatedItem.length > 0) {
                featureFormartUrl.removeFormatedItem.forEach(prop => {
                    delete params[prop];
                    delete data[prop];
                    delete model[prop];
                })
            } else if (util.isObject(featureFormartUrl.removeFormatedItem)) {
                for (let prop in featureFormartUrl.removeFormatedItem) {
                    if (featureFormartUrl.removeFormatedItem[prop]) {
                        delete params[prop];
                        delete data[prop];
                        delete model[prop];
                    }
                }
            } else {
                formatItems.forEach(prop => {
                    delete params[prop];
                    delete data[prop];
                    delete model[prop];
                })
            }
        }
    }

    //计算axios 需要发送的数据
    ajaxOptions.method = ajaxOptions.method || 'get';
    var methodType = (ajaxOptions.method + '').toLowerCase();
    requestDataHandler(methodType, ajaxOptions, requestModel, paramsSerializer, stringifyData);

    // 是否是jsonp方式发送
    var jsonp = process.computeOptions.features.jsonp;
    if (jsonp && jsonp.enabled) {
        ajaxOptions.params = ajaxOptions.params || '';
        var callbackName = 'axios' + new Date().getTime();
        if (ajaxOptions.params) {
            ajaxOptions.params += '&' + jsonp.callback + "=" + callbackName;
        } else {
            ajaxOptions.params += jsonp.callback + "=" + callbackName;
        }
        if (typeof jsonp.link === 'function') {
            ajaxOptions.params = jsonp.link(ajaxOptions.params, ajaxOptions.data, ajaxOptions)
        } else {
            if (typeof ajaxOptions.data === 'string') {
                ajaxOptions.params += '&' + ajaxOptions.data;
            } else if (typeof ajaxOptions.data === 'object') {
                ajaxOptions.params += '&' + paramsSerializer(ajaxOptions.data);
            }
        }

        ajaxOptions.adapter = function (config) {
            return new Promise((resolve, reject) => {
                var script = document.createElement('script');
                var src = config.url;

                if (config.params) {
                    src += (src.indexOf('?') >= 0 ? '&' : '?') + config.params;
                }

                script.async = true;

                var isAbort = false;

                var old = window[callbackName];
                window[callbackName] = function (responseData) {
                    window[jsonp] = old;

                    if (isAbort) {
                        return;
                    }

                    var response = {
                        data: responseData,
                        status: 200
                    }

                    resolve(response);
                };

                script.onload = script.onreadystatechange = function () {

                    if (!script.readyState || /loaded|complete/.test(script.readyState)) {

                        script.onload = script.onreadystatechange = null;

                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }

                        script = null;
                    }
                };
                script.onerror = function () {
                    reject(new Error('Network error'));
                }

                if (config.cancelToken) {
                    config.cancelToken.promise.then(function (cancel) {
                        if (!script) {
                            return;
                        }

                        isAbort = true;
                        reject(cancel);
                    });
                }

                script.src = src;

                document.head.appendChild(script);
            })
        }
    }

    //绑定取消
    var cancelTokenSource = axios.CancelToken.source();
    ajaxOptions.cancelToken = cancelTokenSource.token;

    //5.开始发送请求
    process.cancelToken = cancelTokenSource;

    return iaxios.axios.request(ajaxOptions);
}, function (res, process) {
    var handlerCheckResult = process.computeOptions.handlers.checkResult;
    var result = (handlerCheckResult || function () { return true })(res);
    return result;
});
Feature.map[senderFeature.name] = senderFeature;

export default Feature;

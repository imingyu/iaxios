import axios from 'axios';
import * as util from './util.js';

const stages = ['before', 'sending', 'after'];

var check = (feature, checkData, resolve, process) => {
    var checkResult = feature.checker(checkData, process),
        stage = `${feature.stage}.${feature.name}`;
    if (typeof checkResult === 'undefined') {
        console.log(process);
    }
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

//发送请求功能
const senderFeature = new Feature('sender', 'sending', function (process) {
    var iaxios = process.iaxios,
        requestName = process.requestName,
        requestConfig = process.requestItemConfig,
        ajaxOptions = process.computeOptions.axios,
        handlers = process.computeOptions.handlers;

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

    //4.应用计算后的axios配置信息：axios.request
    var cancelTokenSource = axios.CancelToken.source();
    ajaxOptions.cancelToken = cancelTokenSource.token;
    var requestModel = process.requestArgs && process.requestArgs.length > 0 ? process.requestArgs[0] : {};
    if ((ajaxOptions.method + '').toLowerCase() === 'get') {
        ajaxOptions.params = ajaxOptions.params || {};
        if (typeof ajaxOptions.params === 'object') {
            util.extend(true, ajaxOptions.params, requestModel);
        } else if (typeof ajaxOptions.params === 'string') {
            ajaxOptions.params += '&' + util.paramsSerializer(requestModel);
        }
    } else {
        if (typeof requestModel === 'string' && requestModel != '') {
            if (typeof ajaxOptions.data === 'string') {
                ajaxOptions.data += '&' + util.stringifyData(requestModel);
            } else if (typeof ajaxOptions.data === 'object') {
                ajaxOptions.data = util.stringifyData(requestModel) + '&' + requestModel;
            } else {
                ajaxOptions.data = requestModel;
            }
        } else if (typeof requestModel === 'object') {
            if (typeof ajaxOptions.data === 'object') {
                util.extend(true, ajaxOptions.data, requestModel);
            } else if (typeof ajaxOptions.data === 'string') {
                ajaxOptions.data += '&' + util.stringifyData(requestModel);
            } else {
                ajaxOptions.data = requestModel;
            }
        }
    }
    process.cancelToken = cancelTokenSource;

    //5.开始发送请求
    return iaxios.axios.request(ajaxOptions);
}, function (res, process) {
    var handlerCheckResult = process.computeOptions.handlers.checkResult;
    var result = (handlerCheckResult || function () { return true })(res);
    return result;
});
Feature.map[senderFeature.name] = senderFeature;

export default Feature;

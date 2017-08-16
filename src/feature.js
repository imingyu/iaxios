import axios from 'axios';
import * as util from './util.js';

var CancelToken = axios.CancelToken;

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
        }, data => {
            resolve({
                state: 'reject',
                stage: stage,
                data: checkData
            });
        }).catch(error => {
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
    var ops = process.getIAxiosOptionItem('features.auth');
    if (ops && typeof ops.handler === 'function') {
        return ops.handler(process.getIAxiosOptionItem(`requestConfigList['${process.requestName}']`), process.requestArgs);
    } else {
        return true;
    }
}, null, function (process) {
    var ops = process.getIAxiosOptionItem('features.auth');
    if (typeof ops.onUnAuth === 'function') {
        return ops.onUnAuth(process.getIAxiosOptionItem(`requestConfigList['${process.requestName}']`), process.requestArgs);
    }
});

//validator功能
var validatorFeature = new Feature('validator', 'before', function (process) {
    var requestConfig = process.getIAxiosOptionItem(`requestConfigList['${process.requestName}']`),
        vsAll = process.getIAxiosOptionItem('validators'),
        vsConfig = process.getIAxiosOptionItem('features.validator'),
        vsRequest = vsAll[process.requestName],//request对应的验证器
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
    var checkHanlder = process.getIAxiosOptionItem('features.validator.checkHanlder');
    if (typeof checkHanlder === 'function') {
        return checkHanlder(datas);
    } else {
        return true;
    }
}, function (process) {
    var onUnValid = process.getIAxiosOptionItem('features.validator.onUnValid');
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
        requestConfig = process.getIAxiosOptionItem(`requestConfigList['${requestName}']`),
        ajaxOptions = process.getIAxiosOptionItem('axios');
    process.cancelToken = CancelToken.source();

    //3.获取请求的真实url：getUrl
    var getUrl = process.getIAxiosOptionItem(`handlers.getUrl`);
    if (typeof getUrl === 'function') {
        var computedUrl = getUrl(requestConfig);
        if (computedUrl) {
            ajaxOptions.url = computedUrl + "";
        }
    }

    senderFeature.checker = function (res) {
        return (process.getIAxiosOptionItem('handlers.checkResult') || function () { return true })(res);
    }

    //4.应用计算后的axios配置信息：axios.request 
    ajaxOptions.cancelToken = cancelTokenSource.token;
    var requestModel = process.requestArgs && process.requestArgs.length > 0 ? process.requestArgs[0] : {};
    if (ajaxOptions.method === 'get') {
        ajaxOptions.params = ajaxOptions.params || {};
        if (typeof ajaxOptions.params === 'object') {
            util.extend(true, ajaxOptions.params, requestModel);
        } else if (typeof ajaxOptions.params === 'string') {
            ajaxOptions.params += '&' + util.paramsSerializer(requestModel);
        }
    } else {
        ajaxOptions.data = ajaxOptions.data || {};
        if (typeof ajaxOptions.data === 'object') {
            util.extend(true, ajaxOptions.data, requestModel);
        } else if (typeof ajaxOptions.data === 'string') {
            ajaxOptions.data += '&' + util.stringifyData(requestModel);
        }
    }

    //5.开始发送请求
    return axios.request(ajaxOptions);
});
Feature.map[senderFeature.name] = senderFeature;

export default Feature;
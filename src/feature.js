import * as util from './util.js';

const stages = ['before', 'sending', 'after'];

var check = (feature, checkData, resolve) => {
    var checkResult = feature.checker(checkData),
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
    constructor(name, stage, handler, checker) {
        stage = stage || '';
        stage = stage.toLowerCase();
        this.name = name;
        this.stage = stages.indexOf(stage) != -1 ? stage : 'before';
        this.handler = handler;
        this.checker = typeof checker === 'function' ? checker : function (result) {
            return !!result;
        };
    }

    exec() {
        var self = this,
            args = Array.from(arguments);
        return new Promise((resolve, reject) => {
            var result = self.handler.apply(self, args),
                stage = `${self.stage}.${self.name}`;
            if (util.isPromise(result)) {
                result.then(data => {
                    check(self, data, resolve);
                }).catch(error => {
                    resolve({
                        state: 'reject',
                        stage: stage,
                        data: error
                    });
                })
            } else {
                check(self, result, resolve);
            }
        });
    }
}

Feature.map = {};


//认证功能
Feature.map['auth'] = new Feature('auth', 'before', function (process) {
    var ops = process.computedOptions,
        fs = ops.options.features;
    //读取配置信息中的features.auth选项，如果是个funciton，则返回其执行结果
    if (fs.auth && typeof fs.auth === 'function') {
        return fs.auth(ops.requestConfig, process.requestArgs);
    } else if (fs.auth && typeof fs.auth === 'object') {
        fs.auth.enabled = fs.auth.hasOwnProperty('enabled') ? fs.auth.enabled : true;
        fs.auth.enabled = !!fs.auth.enabled;
        if (typeof fs.auth.handler === 'function') {
            return fs.auth.handler(ops.requestConfig, process.requestArgs);
        } else {
            return true;
        }
    } else {
        return true;
    }
});

//validator功能
var validatorFeature = new Feature('validator', 'before', function (iaxiosIns, requestName, otherOptions, requestArgs) {
    var ops = computeOptions(iaxiosIns, requestName, otherOptions, requestArgs),
        fs = ops.options.features,
        requestConfig = ops.requestConfig,
        vsAll = ops.options.validators,//options.validators存储验证器信息
        vsRequest = vsAll[requestConfig.name],//request对应的验证器
        vsConfig = requestConfig.features && requestConfig.features.validator ? requestConfig.features.validator : [],
        execValidators = [],
        execAll = true;

    if (fs.validator) {
        if (typeof vsRequest === 'function') {
            execValidators.push(vsRequest)
        } else if (Array.isArray(vsRequest)) {
            execValidators = execValidators.concat(vsRequest);
        }
        if (typeof vsConfig === 'function') {
            execValidators.push(vsConfig)
        } else if (Array.isArray(vsConfig)) {
            execValidators = execValidators.concat(vsConfig);
        }

        return Promise.all(execValidators.map(item => {
            var itemResult = item(requestConfig, requestArgs);
            if (util.isPromise(itemResult)) {
                return itemResult;
            } else {
                Promise.resolve(itemResult);
            }
        }));
    } else {
        return true;
    }
});
Feature.map['validator'] = validatorFeature;

export default Feature;
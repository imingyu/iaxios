import * as util from './util.js';

const stages = ['before', 'sending', 'after'];
class Feature {
    constructor(name, stage, handler) {
        stage = stage || '';
        stage = stage.toLowerCase();
        this.name = name;
        this.stage = stages.indexOf(stage) != -1 ? stage : 'before';
        this.handler = handler;
    }

    exec() {
        var self = this,
            args = Array.from(arguments);
        return new Promise((resolve, reject) => {
            var result = self.handler.apply(null, args),
                stage = `${self.stage}.${self.name}`;
            if (util.isPromise(result)) {
                result.then(data => {
                    resolve({
                        state: 'resolve',
                        stage: stage,
                        data: data
                    });
                }).catch(error => {
                    resolve({
                        state: 'reject',
                        stage: stage,
                        data: error
                    });
                })
            } else {
                resolve({
                    state: 'resolve',
                    stage: stage,
                    data: result
                });
            }
        });
    }
}

Feature.map = {};


var computeOptions = (iaxiosIns, requestName, otherOptions, requestArgs) => {
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
}

//认证功能
Feature.map['auth'] = new Feature('auth', 'before', function (iaxiosIns, ops) {
    var ops = computeOptions(iaxiosIns, requestName, otherOptions, requestArgs);
    if (!ops) return;
    var fs = ops.options.features;
    //读取配置信息中的features.auth选项，如果是个funciton，则返回其执行结果
    if (fs.auth && typeof fs.auth === 'function') {
        return fs.auth(ops.requestConfig, requestArgs);
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
    }
});
Feature.map['validator'] = validatorFeature;

export default Feature;
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('axios'), require('qs')) :
	typeof define === 'function' && define.amd ? define(['axios', 'qs'], factory) :
	(global.iaxios = factory(global.axios,global.Qs));
}(this, (function (axios,Qs) { 'use strict';

axios = axios && 'default' in axios ? axios['default'] : axios;
Qs = Qs && 'default' in Qs ? Qs['default'] : Qs;

var version = "0.1.0";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var paramsSerializer = function paramsSerializer(obj) {
    return Qs.stringify(obj, { arrayFormat: 'brackets' }); //如何序列化params，params会拼接的url后面
};
var stringifyData = function stringifyData(obj) {
    return Qs.stringify(obj);
};

var isPromise = function isPromise(obj) {
    return obj && obj.then && obj.catch;
};



// jQuery版extend函数
var extend = function extend() {
    var options,
        name,
        src,
        copy,
        copyIsArray,
        clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        toString = Object.prototype.toString,
        hasOwn = Object.prototype.hasOwnProperty,
        class2type = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regexp',
        '[object Object]': 'object'
    },
        jQuery = {
        isFunction: function isFunction(obj) {
            return jQuery.type(obj) === 'function';
        },
        isArray: Array.isArray || function (obj) {
            return jQuery.type(obj) === 'array';
        },
        isWindow: function isWindow(obj) {
            return obj != null && obj == obj.window;
        },
        isNumeric: function isNumeric(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        },
        type: function type(obj) {
            return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object';
        },
        isPlainObject: function isPlainObject(obj) {
            if (!obj || jQuery.type(obj) !== 'object' || obj.nodeType) {
                return false;
            }
            try {
                if (obj.constructor && !hasOwn.call(obj, 'constructor') && !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
                    return false;
                }
            } catch (e) {
                return false;
            }
            var key;
            for (key in obj) {}
            return key === undefined || hasOwn.call(obj, key);
        }
    };
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        i = 2;
    }
    if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) !== 'object' && !jQuery.isFunction(target)) {
        target = {};
    }
    if (length === i) {
        target = this;
        --i;
    }
    for (i; i < length; i++) {
        if ((options = arguments[i]) != null) {
            for (name in options) {
                src = target[name];
                copy = options[name];
                if (target === copy) {
                    continue;
                }
                if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && jQuery.isArray(src) ? src : [];
                    } else {
                        clone = src && jQuery.isPlainObject(src) ? src : {};
                    }
                    // WARNING: RECURSION
                    target[name] = extend(deep, clone, copy);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }
    return target;
};

var stages = ['before', 'sending', 'after'];

var check = function check(feature, checkData, resolve) {
    var checkResult = feature.checker(checkData),
        stage = feature.stage + '.' + feature.name;
    if (isPromise(checkResult)) {
        checkResult.then(function (result) {
            resolve({
                state: result ? 'resolve' : 'reject',
                stage: stage,
                data: checkData
            });
        }, function (data) {
            resolve({
                state: 'reject',
                stage: stage,
                data: checkData
            });
        }).catch(function (error) {
            resolve({
                state: 'reject',
                stage: stage,
                data: checkData
            });
        });
    } else {
        resolve({
            state: checkResult ? 'resolve' : 'reject',
            stage: stage,
            data: checkData
        });
    }
};

var Feature = function () {
    function Feature(name, stage, handler, checker) {
        classCallCheck(this, Feature);

        stage = stage || '';
        stage = stage.toLowerCase();
        this.name = name;
        this.stage = stages.indexOf(stage) != -1 ? stage : 'before';
        this.handler = handler;
        this.checker = typeof checker === 'function' ? checker : function (result) {
            return !!result;
        };
    }

    createClass(Feature, [{
        key: 'exec',
        value: function exec() {
            var self = this,
                args = Array.from(arguments);
            return new Promise(function (resolve, reject) {
                var result = self.handler.apply(self, args),
                    stage = self.stage + '.' + self.name;
                if (isPromise(result)) {
                    result.then(function (data) {
                        check(self, data, resolve);
                    }).catch(function (error) {
                        resolve({
                            state: 'reject',
                            stage: stage,
                            data: error
                        });
                    });
                } else {
                    check(self, result, resolve);
                }
            });
        }
    }]);
    return Feature;
}();

Feature.map = {};

//认证功能
Feature.map['auth'] = new Feature('auth', 'before', function (process) {
    var ops = process.computedOptions,
        fs = ops.options.features;
    //读取配置信息中的features.auth选项，如果是个funciton，则返回其执行结果
    if (fs.auth && typeof fs.auth === 'function') {
        return fs.auth(ops.requestConfig, process.requestArgs);
    } else if (fs.auth && _typeof(fs.auth) === 'object') {
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
        vsAll = ops.options.validators,
        //options.validators存储验证器信息
    vsRequest = vsAll[requestConfig.name],
        //request对应的验证器
    vsConfig = requestConfig.features && requestConfig.features.validator ? requestConfig.features.validator : [],
        execValidators = [],
        execAll = true;

    if (fs.validator) {
        if (typeof vsRequest === 'function') {
            execValidators.push(vsRequest);
        } else if (Array.isArray(vsRequest)) {
            execValidators = execValidators.concat(vsRequest);
        }
        if (typeof vsConfig === 'function') {
            execValidators.push(vsConfig);
        } else if (Array.isArray(vsConfig)) {
            execValidators = execValidators.concat(vsConfig);
        }

        return Promise.all(execValidators.map(function (item) {
            var itemResult = item(requestConfig, requestArgs);
            if (isPromise(itemResult)) {
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

var Process = function () {
    function Process() {
        classCallCheck(this, Process);

        this.stack = [];
        this.iaxios = null;
        this.requestName = '';
        this.requestArgs = null;
        this.isCancel = false;
        this.dataMap = [];
        this.cancelToken = null;
    }

    createClass(Process, [{
        key: 'use',
        value: function use(handler) {
            if (typeof handler !== 'function') return;
            this.stack.push(handler);
        }
    }, {
        key: 'next',
        value: function next() {
            var item = this.stack.shift();
            if (item) {
                item(this.next.bind(this));
            }
        }
    }]);
    return Process;
}();

var defaultIAxiosOptions = {
    requestConfigList: {}, //request配置元信息集合
    axios: {
        //axios配置
        method: 'get',
        paramsSerializer: paramsSerializer,
        headers: {
            common: {
                'Content-Type': 'application/json'
            },
            post: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        },
        transformRequest: [function (data, headers) {
            return stringifyData(data);
        }]
    },
    features: { //启用iaxios的哪些功能？
        auth: false,
        jsonp: false, //接口是否以jsonp方式发送
        tip: true, //当某些配置无法找到，或者功能未启用时，是否在控制台提示相关消息
        validator: false //启用验证器，调用iaxios.createRequest()返回的方法时，先取request配置中的验证器去验证参数，验证通过才会执行下面的逻辑
    },
    handlers: {
        //获取请求的真实url
        getUrl: function getUrl(requestConfig) {
            return requestConfig.url;
        },

        //检查请求返回的结果，成功请resolve，失败请reject
        checkResult: function checkResult(res) {
            return res && res.data ? true : false;
        },

        //格式化请求成功的数据
        resolveConvert: function resolveConvert(res) {
            return res.data;
        },

        //格式化请求失败的数据
        rejectConvert: function rejectConvert(rejectDataMap) {
            return rejectDataMap;
        }
    }
};

var CancelToken = axios.CancelToken;

var featureSender = new Feature('sender', 'sending', function (process) {
    console.log(process);
    var options = process.computedOptions.options || {},
        iaxios = process.iaxios,
        axios$$1 = iaxios.axios,
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
        return (process.computedOptions.options.handlers.checkResult || function () {
            return true;
        })(res);
    };

    //4.应用计算后的axios配置信息：axios.request 
    options.axios.cancelToken = cancelTokenSource.token;
    var requestModel = process.requestArgs && process.requestArgs.length > 0 ? process.requestArgs[0] : {};
    if (options.axios.method === 'get') {
        options.axios.params = options.axios.params || {};
        if (_typeof(options.axios.params) === 'object') {
            extend(true, options.axios.params, requestModel);
        } else if (typeof options.axios.params === 'string') {
            options.axios.params += '&' + paramsSerializer(requestModel);
        }
    } else {
        options.axios.data = options.axios.data || {};
        if (_typeof(options.axios.data) === 'object') {
            extend(true, options.axios.data, requestModel);
        } else if (typeof options.axios.data === 'string') {
            options.axios.data += '&' + stringifyData(requestModel);
        }
    }

    //5.开始发送请求
    return axios$$1.request(options.axios);
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

var IAxios = function () {
    function IAxios(ops) {
        classCallCheck(this, IAxios);

        this.id = (Math.random() + "").replace('0.', '');

        //创建一个axios实例
        this.axios = axios.create();

        //功能实例
        this.featuresIns = {};

        this.options = {};
        this.setOptions(ops);
    }

    createClass(IAxios, [{
        key: 'createRequest',
        value: function createRequest(requestName, otherOptions) {
            var iaxiosIns = this;

            return function request(model, ops) {
                var requestArgs = Array.from(arguments),
                    process = new Process(),
                    computeOptions = function computeOptions() {
                    var options = extend(true, {}, defaultIAxiosOptions, iaxiosIns.options),
                        requestConfig = options.requestConfigList[requestName];

                    if (!requestConfig) return;

                    var copyRequestConfig = extend(true, {}, requestConfig);

                    extend(true, options.features, copyRequestConfig.features || {});
                    delete copyRequestConfig.features;
                    extend(true, options.handlers, copyRequestConfig.handlers || {});
                    delete copyRequestConfig.handlers;
                    extend(true, options.axios, copyRequestConfig);

                    if (otherOptions) extend(true, options, otherOptions);
                    if (requestArgs.length > 1 && _typeof(requestArgs[1]) === 'object') {
                        extend(true, options, requestArgs[1]);
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
                    checkCancel = function checkCancel(reject) {
                    if (process.isCancel) {
                        reject(rejectConvert(process.dataMap));
                        return true;
                    }
                };
                process.iaxios = iaxiosIns;
                process.requestName = requestName;
                process.requestArgs = requestArgs;
                process.isCancel = false;
                process.dataMap = [];
                process.cancelToken = null;

                var promise = new Promise(function (resolve, reject) {
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
                            process.iaxios.featuresIns.auth.exec(process).then(function (data) {
                                process.dataMap.push(data);
                                if (data.state === 'resolve') {
                                    next();
                                } else {
                                    if (_typeof(ops.options.features.auth) === 'object' && typeof ops.options.features.auth.onUnAuth === 'function') {
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
                            process.iaxios.featuresIns.validator.exec(process).then(function (data) {
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
                        featureSender.exec(process).then(function (data) {
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
            };
        }
    }, {
        key: 'setOptions',
        value: function setOptions(ops) {
            if ((typeof ops === 'undefined' ? 'undefined' : _typeof(ops)) === 'object') {
                this.options = extend(true, {}, defaultIAxiosOptions, this.options, ops);
                extend(true, this.axios.defaults, this.options.axios || {});

                var self = this;
                Object.keys(this.options.features).forEach(function (key) {
                    var fe = Feature.map[key];
                    if (fe) {
                        self.featuresIns[key] = Feature.map[key];
                    } else {
                        self.log('[IAxios]\u4E0D\u5B58\u5728\u540D\u79F0\u662F ' + key + ' \u7684Feature;');
                    }
                });
            }
        }
    }, {
        key: 'log',
        value: function log(msg) {
            if (this.options.features && this.options.features.tip) {
                (typeof this.options.features.tip === 'function' ? this.options.features.tip : console.warn)(msg);
            }
        }
    }], [{
        key: 'create',
        value: function create(ops) {
            return new IAxios(ops);
        }
    }, {
        key: 'createRequest',
        value: function createRequest(requestName, otherOptions) {
            return IAxios.map['default'].createRequest(requestName, otherOptions);
        }
    }, {
        key: 'setOptions',
        value: function setOptions(ops) {
            if ((typeof ops === 'undefined' ? 'undefined' : _typeof(ops)) === 'object') {
                extend(true, defaultIAxiosOptions, ops);
                IAxios.map['default'].setOptions(ops);
            }
        }
    }]);
    return IAxios;
}();

IAxios.map = {};

var defaultIAxios = IAxios.create();
defaultIAxios.id = "default";
IAxios.map['default'] = defaultIAxios;

var index = {
    create: IAxios.create,
    createRequest: IAxios.createRequest,
    setOptions: IAxios.setOptions,
    IAxios: IAxios,
    version: version
};

return index;

})));
//# sourceMappingURL=iaxios.js.map

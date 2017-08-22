(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('axios'), require('qs')) :
	typeof define === 'function' && define.amd ? define(['axios', 'qs'], factory) :
	(global.iaxios = factory(global.axios,global.Qs));
}(this, (function (axios,Qs) { 'use strict';

axios = axios && axios.hasOwnProperty('default') ? axios['default'] : axios;
Qs = Qs && Qs.hasOwnProperty('default') ? Qs['default'] : Qs;

var version = "0.1.1";

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



var getValue = function getValue(propExp, obj) {
    try {
        var fun = new Function('obj', 'var result;try{result=obj.' + propExp + ';}catch(error){};return result;');
        return fun(obj);
    } catch (error) {}
};

var validOptions = function validOptions(ops) {
    if ((typeof ops === 'undefined' ? 'undefined' : _typeof(ops)) === 'object') {
        var msg = function msg(item) {
            return item + '\u5FC5\u9700\u662Fobject\u7C7B\u578B';
        };
        if (ops.hasOwnProperty('features') && _typeof(ops.features) !== 'object') {
            throw new TypeError(msg('options.features'));
        }
        if (ops.hasOwnProperty('requestConfigList') && _typeof(ops.requestConfigList) !== 'object') {
            throw new TypeError(msg('options.requestConfigList'));
        }
        if (ops.hasOwnProperty('axios') && _typeof(ops.axios) !== 'object') {
            throw new TypeError(msg('options.axios'));
        }
        if (ops.hasOwnProperty('validators') && _typeof(ops.validators) !== 'object') {
            throw new TypeError(msg('options.validators'));
        }
        if (ops.hasOwnProperty('handlers') && _typeof(ops.handlers) !== 'object') {
            throw new TypeError(msg('options.handlers'));
        }
    }
};

var standardAuthOptions = function standardAuthOptions(item) {
    var vi;
    if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
        vi = item;
    } else if (typeof item === 'function') {
        vi = {
            handler: item
        };
    } else {
        vi = {
            enabled: item
        };
    }
    return vi;
};

var standardFeaturesOptions = function standardFeaturesOptions(ops) {
    if (ops && _typeof(ops.features) === 'object') {
        Object.keys(ops.features).forEach(function (key) {
            var val = ops.features[key];
            if (typeof val === 'undefined' || val == null) {
                delete ops.features[key];
            } else if (typeof val === 'boolean') {
                ops.features[key] = {
                    enabled: val
                };
            }
        });
    }
    return ops;
};

var standardRequestConfigItem = function standardRequestConfigItem(cfg) {
    if (!cfg) return;
    if ((typeof cfg === 'undefined' ? 'undefined' : _typeof(cfg)) === 'object') {
        standardFeaturesOptions(cfg);
        var result = {
            features: cfg.features,
            handlers: cfg.handlers || {},
            requestConfigList: undefined,
            axios: undefined,
            validators: undefined
        },
            axiosOps = {};

        Object.keys(cfg).forEach(function (item) {
            if (!result.hasOwnProperty(item)) {
                axiosOps[item] = cfg[item];
            }
        });
        result.axios = axiosOps;
        return result;
    }
    return cfg;
};

var standardOptions = function standardOptions(ops) {
    if (!ops || (typeof ops === 'undefined' ? 'undefined' : _typeof(ops)) !== 'object' || ops === null) return;
    standardFeaturesOptions(ops);
    return ops;
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

var check = function check(feature, checkData, resolve, process) {
    var checkResult = feature.checker(checkData, process),
        stage = feature.stage + '.' + feature.name;
    if (isPromise(checkResult)) {
        checkResult.then(function (result) {
            resolve({
                state: result ? 'resolve' : 'reject',
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
    function Feature(name, stage, handler, checker, beforeReject) {
        classCallCheck(this, Feature);

        stage = stage || '';
        stage = stage.toLowerCase();
        this.name = name;
        this.stage = stages.indexOf(stage) != -1 ? stage : 'before';
        this.handler = handler;
        this.checker = typeof checker === 'function' ? checker : function (result) {
            return result;
        };
        this.beforeReject = typeof beforeReject === 'function' ? beforeReject : function () {};
    }

    createClass(Feature, [{
        key: 'exec',
        value: function exec(process) {
            var self = this,
                args = Array.from(arguments);
            return new Promise(function (resolve, reject) {
                var result = self.handler.apply(self, args),
                    stage = self.stage + '.' + self.name;
                if (isPromise(result)) {
                    result.then(function (data) {
                        check(self, data, resolve, process);
                    }).catch(function (error) {
                        if (axios.isCancel(error)) {
                            stage = "cancel";
                        }
                        resolve({
                            state: 'reject',
                            stage: stage,
                            data: error
                        });
                    });
                } else {
                    check(self, result, resolve, process);
                }
            });
        }
    }]);
    return Feature;
}();

Feature.map = {};

//认证功能
Feature.map['auth'] = new Feature('auth', 'before', function (process) {
    var authOps = process.featureOptions.auth;
    if (authOps && typeof authOps.handler === 'function') {
        return authOps.handler(process.getIAxiosOptionItem('requestConfigList[\'' + process.requestName + '\']'), process.requestArgs);
    } else {
        return true;
    }
}, null, function (process) {
    var authOps = process.featureOptions.auth;
    if (typeof authOps.onUnAuth === 'function') {
        authOps.onUnAuth(process.getIAxiosOptionItem('requestConfigList[\'' + process.requestName + '\']'), process.requestArgs);
    }
});

//validator功能
var validatorFeature = new Feature('validator', 'before', function (process) {
    var requestConfig = process.getIAxiosOptionItem('requestConfigList[\'' + process.requestName + '\']'),
        vsAll = process.getIAxiosOptionItem('validators'),
        vsConfig = process.featureOptions.validator,
        vsRequest = vsAll[process.requestName],
        //request对应的验证器
    execValidators = [];

    if (typeof vsRequest === 'function') {
        execValidators.push(vsRequest);
    } else if (Array.isArray(vsRequest)) {
        execValidators = execValidators.concat(vsRequest);
    }
    if (typeof vsConfig === 'function') {
        execValidators.push(vsConfig);
    } else if (Array.isArray(vsConfig)) {
        execValidators = execValidators.concat(vsConfig);
    } else if ((typeof vsConfig === 'undefined' ? 'undefined' : _typeof(vsConfig)) === 'object' && vsConfig.enabled && vsConfig.validators) {
        execValidators = execValidators.concat(vsConfig.validators || []);
    }

    return Promise.all(execValidators.map(function (item) {
        var itemResult = item(requestConfig, process.requestArgs);
        if (isPromise(itemResult)) {
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
        var validatorData = process.dataMap.find(function (item) {
            return item.stage === 'before.validator';
        });
        return onUnValid(validatorData ? validatorData.data : undefined);
    }
});
Feature.map[validatorFeature.name] = validatorFeature;

//发送请求功能
var senderFeature = new Feature('sender', 'sending', function (process) {
    var iaxios = process.iaxios,
        requestName = process.requestName,
        requestConfig = process.getIAxiosOptionItem('requestConfigList[\'' + requestName + '\']'),
        ajaxOptions = process.getIAxiosOptionItem('axios'),
        handlers = process.getIAxiosOptionItem('handlers');

    //3.获取请求的真实url：getUrl
    if (typeof handlers.getUrl === 'function') {
        var computedUrl = handlers.getUrl(requestConfig);
        if (computedUrl) {
            ajaxOptions.url = computedUrl + "";
        } else {
            ajaxOptions.url = requestConfig.url;
        }
    }
    if (!ajaxOptions.url || String.prototype.trim.call(ajaxOptions.url) === "") {
        ajaxOptions.url = requestName + "";
    }

    senderFeature.checker = function (res) {
        return (process.getIAxiosOptionItem('handlers.checkResult') || function () {
            return true;
        })(res);
    };

    //4.应用计算后的axios配置信息：axios.request 
    var cancelTokenSource = axios.CancelToken.source();
    ajaxOptions.cancelToken = cancelTokenSource.token;
    var requestModel = process.requestArgs && process.requestArgs.length > 0 ? process.requestArgs[0] : {};
    if (ajaxOptions.method === 'get') {
        ajaxOptions.params = ajaxOptions.params || {};
        if (_typeof(ajaxOptions.params) === 'object') {
            extend(true, ajaxOptions.params, requestModel);
        } else if (typeof ajaxOptions.params === 'string') {
            ajaxOptions.params += '&' + paramsSerializer(requestModel);
        }
    } else {
        ajaxOptions.data = ajaxOptions.data || {};
        if (_typeof(ajaxOptions.data) === 'object') {
            extend(true, ajaxOptions.data, requestModel);
        } else if (typeof ajaxOptions.data === 'string') {
            ajaxOptions.data += '&' + stringifyData(requestModel);
        }
    }
    process.cancelToken = cancelTokenSource;

    //5.开始发送请求
    return iaxios.axios.request(ajaxOptions);
});
Feature.map[senderFeature.name] = senderFeature;

var defaultConvert = function defaultConvert(data) {
    return data;
};

var getConvert = function getConvert(name, process) {
    var convert = process.getIAxiosOptionItem('handlers.' + name);
    convert = typeof convert === 'function' ? defaultConvert : convert;
    return convert;
};

var Process = function () {
    function Process() {
        classCallCheck(this, Process);

        this.stack = [];
        this.iaxios = null;
        this.otherOptions = null;
        this.requestName = '';
        this.requestArgs = null;
        this.isCancel = false;
        this.dataMap = [];
        this.cancelToken = null;
    }

    createClass(Process, [{
        key: 'run',
        value: function run() {
            //执行run函数后，即锁定当前配置中的Feature，解释后续再有功能的配置变化，也不会执行，函数除外
            var process = this;

            function CancelPromise(executor) {
                var p = new Promise(function (resolve, reject) {
                    // before
                    return executor(resolve, reject);
                });
                // after
                p.__proto__ = CancelPromise.prototype;
                return p;
            }
            CancelPromise.__proto__ = Promise;
            CancelPromise.prototype.__proto__ = Promise.prototype;
            CancelPromise.prototype.cancel = function (data) {
                return process.cancel(data);
            };

            var promise = new CancelPromise(function (resolve, reject) {
                var orgFeatures = process.getIAxiosOptionItem('features');
                var keys = Object.keys(orgFeatures).filter(function (name) {
                    var f = orgFeatures[name];
                    return !!f.enabled; //只抓取已启用的功能
                });
                var features = keys.map(function (name) {
                    return Feature.map[name];
                }).filter(function (f) {
                    return !!f;
                });
                features.push(Feature.map['sender']);
                features = features.filter(function (f) {
                    return f.stage === 'before';
                }).concat(features.filter(function (f) {
                    return f.stage === 'sending';
                }), features.filter(function (f) {
                    return f.stage === 'after';
                }));

                //将功能实例赋值到process上
                process.featureInstances = features;
                process.featureOptions = orgFeatures;

                features.forEach(function (featureIns) {
                    process.use(function (next) {
                        if (process.isCancel) {
                            reject(getConvert('rejectConvert', process)(process.dataMap, process.getIAxiosOptionItem('requestConfigList[\'' + process.requestName + '\']')));
                            return;
                        }

                        featureIns.exec(process).then(function (data) {
                            process.dataMap.push(data);
                            if (data.state === 'resolve') {
                                if (featureIns.requiredResolve) {
                                    if (typeof featureIns.breforeResolve === 'function') {
                                        featureIns.breforeResolve(process);
                                    }
                                    resolve(getConvert('resolveConvert', process)(data.data, process.getIAxiosOptionItem('requestConfigList[\'' + process.requestName + '\']')));
                                } else {
                                    if (process.stack.length > 0) {
                                        next();
                                    } else {
                                        resolve(getConvert('resolveConvert', process)(data.data, process.getIAxiosOptionItem('requestConfigList[\'' + process.requestName + '\']')));
                                    }
                                }
                            } else {
                                if (typeof featureIns.beforeReject === 'function') {
                                    featureIns.beforeReject(process);
                                }
                                reject(getConvert('rejectConvert', process)(process.dataMap, process.getIAxiosOptionItem('requestConfigList[\'' + process.requestName + '\']')));
                            }
                        });
                    });
                });
                process.next();
            });
            return promise;
        }
    }, {
        key: 'cancel',
        value: function cancel(data) {
            if (this.isCancel) return;
            this.isCancel = true;
            if (this.cancelToken) {
                this.cancelToken.cancel(data);
            }
        }
    }, {
        key: 'getIAxiosOptionItem',
        value: function getIAxiosOptionItem(propExp) {
            var configProp = 'requestConfigList[\'' + this.requestName + '\']',
                sendOptions = this.requestArgs.length > 1 ? this.requestArgs[this.requestArgs.length - 1] : undefined,
                otherOptions = this.otherOptions;
            if (configProp == propExp) {
                return this.iaxios.getOptionItem(propExp, sendOptions, otherOptions);
            } else {
                var requestConfig = this.getIAxiosOptionItem(configProp),
                    standardConfig = standardRequestConfigItem(requestConfig);
                return this.iaxios.getOptionItem.call(this.iaxios, propExp, sendOptions, otherOptions, (typeof standardConfig === 'undefined' ? 'undefined' : _typeof(standardConfig)) === 'object' ? standardConfig : undefined);
            }
        }
    }, {
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
    validators: {}, //验证器列表
    features: { //启用iaxios的哪些功能？
        auth: {
            enabled: false
        },
        jsonp: {
            enabled: false
        }, //接口是否以jsonp方式发送
        validator: {
            enabled: false //启用验证器，调用iaxios.createRequest()返回的方法时，先取request配置中的验证器去验证参数，验证通过才会执行下面的逻辑
        } },
    handlers: {
        //获取请求的真实url
        getUrl: function getUrl(requestConfig) {
            return requestConfig.url;
        },

        //检查请求返回的结果，成功请resolve，失败请reject
        checkResult: function checkResult(res, requestConfig) {
            return res && res.data ? true : false;
        },

        //格式化请求成功的数据
        resolveConvert: function resolveConvert(res, requestConfig) {
            return res.data;
        },

        //格式化请求失败的数据
        rejectConvert: function rejectConvert(rejectDataMap, requestConfig) {
            return rejectDataMap;
        }
    }
};

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
        IAxios.map[this.id] = this;

        //创建一个axios实例
        this.axios = axios.create();

        this.options = {};
        this.setOptions(ops);
    }

    createClass(IAxios, [{
        key: 'createRequest',
        value: function createRequest(requestName, otherOptions) {
            var iaxiosIns = this;

            return function request(model, ops) {
                var requestArgs = Array.from(arguments),
                    process = new Process();
                process.iaxios = iaxiosIns;
                process.otherOptions = otherOptions;
                process.requestName = requestName;
                process.requestArgs = requestArgs;
                process.isCancel = false;
                process.dataMap = [];
                process.cancelToken = null;

                return process.run();
            };
        }
    }, {
        key: 'setOptions',
        value: function setOptions(ops) {
            if ((typeof ops === 'undefined' ? 'undefined' : _typeof(ops)) === 'object') {
                validOptions(ops);
                standardFeaturesOptions(ops);
                extend(true, this.options, ops);
            }
        }
    }, {
        key: 'getOptionItem',
        value: function getOptionItem(key) {
            if (!key) return;

            var preOptions = arguments.length > 1 ? Array.from(arguments).splice(1, arguments.length - 1) : [];

            var vals = [];
            if (preOptions.length > 0) {
                preOptions.forEach(function (item) {
                    if (item) vals.push(getValue(key, standardOptions(item)));
                });
            }
            vals.push(getValue(key, this.options));
            vals.push(getValue(key, defaultIAxiosOptions));
            vals = vals.filter(function (v) {
                return typeof v !== 'undefined' && v != null;
            });

            var val;

            if (vals.length > 0) {
                if (key === 'features') {
                    if (_typeof(vals[0]) != 'object') {
                        val = vals[0];
                    } else {
                        val = extend.apply(null, [true, {}].concat(vals.reverse()));
                        Object.keys(val).map(function (v) {
                            val[v] = standardAuthOptions(val[v]);
                        });
                    }
                } else if (key.indexOf('features.') == 0 && key.lastIndexOf('.') !== key.length - 1) {
                    if (key.indexOf('.') === key.lastIndexOf('.')) {
                        if (typeof vals[0] === 'boolean' && vals[0] === false) {
                            val = {
                                enabled: false
                            };
                        } else {
                            var arr = [];
                            vals.forEach(function (item) {
                                arr.push(standardAuthOptions(item));
                            });
                            val = extend.apply(null, [true, {}].concat(arr.reverse()));
                        }
                    } else {
                        val = vals.find(function (v) {
                            return typeof v !== 'undefined' && v != null;
                        });
                    }
                } else if (key === 'axios') {
                    val = extend.apply(null, [true, {}].concat(vals.reverse()));
                } else {
                    if (vals.some(function (item) {
                        return (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object';
                    })) {
                        val = extend.apply(null, [true, {}].concat(vals.reverse()));
                    } else {
                        val = vals.find(function (v) {
                            return typeof v !== 'undefined' && v != null;
                        });
                    }
                }
            }
            return val;
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
                validOptions(ops);
                standardFeaturesOptions(ops);
                extend(true, defaultIAxiosOptions, ops);
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

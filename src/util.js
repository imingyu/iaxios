import Qs from 'qs';
export var paramsSerializer = obj => {
    return Qs.stringify(obj, { arrayFormat: 'brackets' });//如何序列化params，params会拼接的url后面
}
export var stringifyData = obj => {
    return Qs.stringify(obj);
}

export var isPromise = obj => {
    return obj && obj.then && obj.catch;
}

export var uniqueID = () => {
    return (Math.random() + '').replace('0.', '');
}

export var getValue = (propExp, obj) => {
    try {
        var fun = new Function('obj', 'var result;try{result=obj.' + propExp + ';}catch(error){};return result;');
        return fun(obj);
    } catch (error) {
    }
};

export var validOptions = ops => {
    if (typeof ops === 'object') {
        var msg = item => {
            return `${item}必需是object类型`;
        }
        if (ops.hasOwnProperty('features') && typeof ops.features !== 'object') {
            throw new TypeError(msg('options.features'));
        }
        if (ops.hasOwnProperty('requestConfigList') && typeof ops.requestConfigList !== 'object') {
            throw new TypeError(msg('options.requestConfigList'));
        }
        if (ops.hasOwnProperty('axios') && typeof ops.axios !== 'object') {
            throw new TypeError(msg('options.axios'));
        }
        if (ops.hasOwnProperty('validators') && typeof ops.validators !== 'object') {
            throw new TypeError(msg('options.validators'));
        }
        if (ops.hasOwnProperty('handlers') && typeof ops.handlers !== 'object') {
            throw new TypeError(msg('options.handlers'));
        }
    }
}

export var standardAuthOptions = item => {
    var vi;
    if (typeof item === 'object') {
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
}

export var standardFeaturesOptions = ops => {
    if (ops && typeof ops.features === 'object') {
        Object.keys(ops.features).forEach(key => {
            var val = ops.features[key];
            if (typeof val === 'undefined' || val == null) {
                delete ops.features[key];
            } else if (typeof val === 'boolean') {
                ops.features[key] = {
                    enabled: val
                }
            }
        })
    }
    return ops;
}

export var transformJsonp = (content, callbackName) => {
    var fun = new Function('var ' + callbackName + '=function(data){return data;}; return ' + callbackName + '(' + content + ');');
    return fun();
}

export var standardRequestConfigItem = (cfg) => {
    if (!cfg) return;
    if (typeof cfg === 'object') {
        standardFeaturesOptions(cfg);
        var result = {
            features: cfg.features,
            handlers: cfg.handlers || {},
            requestConfigList: undefined,
            axios: undefined,
            validators: undefined
        },
            axiosOps = {};

        Object.keys(cfg).forEach(item => {
            if (!result.hasOwnProperty(item)) {
                axiosOps[item] = cfg[item];
            }
        });
        result.axios = axiosOps;
        return result;
    }
    return cfg;
}

export var standardOptions = (ops) => {
    if (!ops || typeof ops !== 'object' || ops === null) return;
    standardFeaturesOptions(ops);
    return ops;
}

// jQuery版extend函数
export var extend = function () {
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
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
            isFunction: function (obj) {
                return jQuery.type(obj) === 'function'
            },
            isArray: Array.isArray ||
                function (obj) {
                    return jQuery.type(obj) === 'array'
                },
            isWindow: function (obj) {
                return obj != null && obj == obj.window
            },
            isNumeric: function (obj) {
                return !isNaN(parseFloat(obj)) && isFinite(obj)
            },
            type: function (obj) {
                return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object'
            },
            isPlainObject: function (obj) {
                if (!obj || jQuery.type(obj) !== 'object' || obj.nodeType) {
                    return false
                }
                try {
                    if (obj.constructor && !hasOwn.call(obj, 'constructor') && !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
                        return false
                    }
                } catch (e) {
                    return false
                }
                var key;
                for (key in obj) { }
                return key === undefined || hasOwn.call(obj, key)
            }
        };
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        i = 2;
    }
    if (typeof target !== 'object' && !jQuery.isFunction(target)) {
        target = {}
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
                    continue
                }
                if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && jQuery.isArray(src) ? src : []
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
}

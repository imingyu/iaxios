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
    return (Math.random() + "").replace('0.', '');
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
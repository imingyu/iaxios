var iaxios = require('../dist/iaxios.js');
var assert = require('chai').assert;

var instance = (name) => {
    if (name) {
        iaxios = iaxios.create();
    }
    describe(`test instance:${name}`, () => {
        describe('setOptions', () => {
            it('requestConfigList', () => {

            })
            var orgOptionis = {
                requestConfigList: {}, //request配置元信息集合
                axios: {
                    //axios配置
                    method: 'get',
                    paramsSerializer: util.paramsSerializer,
                    headers: {
                        common: {
                            'Content-Type': 'application/json'
                        },
                        post: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    },
                    transformRequest: [function (data, headers) {
                        return util.stringifyData(data);
                    }]
                },
                features: { //启用iaxios的哪些功能？
                    auth: false,
                    jsonp: false, //接口是否以jsonp方式发送
                    tip: true, //当某些配置无法找到，或者功能未启用时，是否在控制台提示相关消息
                    validator: false//启用验证器，调用iaxios.createRequest()返回的方法时，先取request配置中的验证器去验证参数，验证通过才会执行下面的逻辑
                },
                handlers: {
                    //获取请求的真实url
                    getUrl(requestConfig) {
                        return requestConfig.url;
                    },
                    //检查请求返回的结果，成功请resolve，失败请reject
                    checkResult(res) {
                        return res && res.data ? true : false;
                    },
                    //格式化请求成功的数据
                    resolveConvert(res) {
                        return res.data;
                    },
                    //格式化请求失败的数据
                    rejectConvert(rejectDataMap) {
                        return rejectDataMap;
                    }
                }
            }
            iaxios.setOptions(orgOptionis);
        })
    });
}
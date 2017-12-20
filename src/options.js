import * as util from './util.js';
export default {
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
    validators: {}, //验证器列表
    features: { //启用iaxios的哪些功能？
        auth: {
            enabled: false
        },
        formatUrl: {
            enabled: true,
            removeFormatedItem: true /*
            格式化后，是否移除已经用到的格式化项
            支持4中值：
            true:移除所有
            false:保留所有
            ['item1','item2']:移除'item1'和'item2'
            {item1:true,item2:false}:移除'item1',保留'item2'
             */
        },//格式化url
        jsonp: {
            enabled: false,
            callback: 'callback',
            link: null // 怎样连接params和data？
        }, //接口是否以jsonp方式发送
        validator: {
            enabled: false
        }//启用验证器，调用iaxios.createRequest()返回的方法时，先取request配置中的验证器去验证参数，验证通过才会执行下面的逻辑
    },
    handlers: {
        //获取请求的真实url
        getUrl(requestConfig) {
            return requestConfig.url;
        },
        //检查请求返回的结果，成功请resolve，失败请reject
        checkResult(res, requestConfig) {
            return res && res.data ? true : false;
        },
        //格式化请求成功的数据
        resolveConvert(res, requestConfig) {
            return res.data;
        },
        //格式化请求失败的数据
        rejectConvert(rejectDataMap, requestConfig) {
            return rejectDataMap;
        }
    }
};

import Qs from 'qs';
export var iaxios = {
    requestConfigList: {}, //request配置元信息集合
    axios: {
        //axios配置
        paramsSerializer: function (params) {
            return Qs.stringify(params, { arrayFormat: 'brackets' });//如何序列化params，params会拼接的url后面
        },
        headers: {
            common: {
                'Content-Type': 'application/json'
            },
            post: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        },
        transformRequest: [function (data, headers) {
            return Qs.stringify(data);//如何序列化data，data是发送的body
        }]
    },
    features: { //启用iaxios的哪些功能？
        auth: true, //接口发送前需要检查用户是否已经认证
        jsonp: true, //接口是否以jsonp方式发送
        tip: true, //当某些配置无法找到，或者功能未启用时，是否在控制台提示相关消息
        validator: false//启用验证器，调用iaxios.createRequest()返回的方法时，先取request配置中的验证器去验证参数，验证通过才会执行下面的逻辑
    },
    handlers: {
        //获取请求的真实url
        getUrl(requestConfig) {
            return requestConfig.url;
        },
        //检查当前环境是否已经有已认证(登录)的用户
        checkAuth(requestConfig) {
            return Promise.resolve(true);
        },
        //未认证情况下做什么事
        unAuth(data) {
            return Promise.resolve(data);
        },
        //处理tip信息的函数
        logTip(msg) {
            console.warn(msg);
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
        rejectConvert(res, error) {
            return res && res.data ? res.data : error
        },
        //格式化取消请求的数据
        cancelConvert(thrown) {
            return thrown
        },
        //格式化未认证时的数据
        unAuthConvert(checkAuthResult) {
            return checkAuthResult;
        },
        //验证函数
        validator(args) {
            return true;
        },
        validConvert(validResult) {
            return {
                valid: validResult
            }
        }
    }
};

export var request = {
    url: '',
    method: 'get',
    features: { //这个request启用iaxios的哪些功能？
        auth: true, //接口发送前需要检查用户是否已经认证
        jsonp: false, //接口是否以jsonp方式发送
        tip: true, //当某些配置无法找到，或者功能未启用时，是否在控制台提示相关消息
        validator: false//启用验证器，调用iaxios.createRequest()返回的方法时，先取request配置中的验证器去验证参数，验证通过才会执行下面的逻辑
    },
    handlers: {}
}
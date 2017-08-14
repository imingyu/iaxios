import iaxios from 'iaxios';
import Qs from 'qs';

iaxios.options({
    requestConfig: {}, //request配置元信息
    axios: {
        paramsSerializer: function (params) {
            return Qs.stringify(params, { arrayFormat: 'brackets' })
        }
    }, //axios配置
    features: { //启用iaxios功能
        auth: true, //接口发送前需要检查用户是否已经认证
        jsonp: true, //接口是否以jsonp方式发送
        tip: true //当某些配置无法找到，或者功能未启用时，是否在控制台提示相关消息
    },
    handlers: {
        //this === requestConfig
        getUrl(requestConfig) {
            return requestConfig.url;
        },
        checkAuth(requestConfig) {
            return Promise.resolve(true);
        },
        unAuth(data) {
            return Promise.resolve(data);
        },
        logTip(msg) {
            console.warn(msg);
        },
        checkResult(data) {
            return Promise.resolve(true);
        },
        resolveConvert(res) {
            return Promise.resolve(res.data);
        },
        rejectConvert(res, error) {
            return Promise.resolve(res && res.data ? res.data : error);
        },
        cancelConvert(thrown) {
            return Promise.resolve(thrown);
        },
        unAuthConvert(checkAuthResult) {
            return Promise.resolve(checkAuthResult);
        }
    }
});


var requestOptions = {
    url: 'http://xxx.com/user/list',
    method: 'get',
    auth: true
};
var request = iaxios.create(requestOptions);
request().then(list => { }).catch(error => { });
request.cancel(); //取消发送

iaxios.send(requestOptions)
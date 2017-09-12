import axios from 'axios';
import Process from './process.js';
import * as util from './util.js';
import defaultIAxiosOptions from './options.js';

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

class IAxios {
    constructor(ops) {
        this.id = (Math.random() + '').replace('0.', '');
        IAxios.map[this.id] = this;

        //创建一个axios实例
        this.axios = axios.create();

        this.options = {};
        this.setOptions(ops);
    }
    createRequest(requestName, otherOptions) {
        var iaxiosIns = this;

        return function request(model, ops) {
            var requestArgs = Array.from(arguments),
                process = new Process();
            process.iaxios = iaxiosIns;
            process.otherOptions = otherOptions;
            process.senderOptions = ops;
            process.senderModel = model;
            process.requestName = requestName;
            process.requestArgs = requestArgs;
            process.isCancel = false;
            process.dataMap = [];
            process.cancelToken = null;

            return process.run();
        }
    }
    setOptions(ops) {
        if (typeof ops === 'object') {
            util.validOptions(ops);
            util.standardFeaturesOptions(ops);
            util.extend(true, this.options, ops);
        }
    }
    static create(ops) {
        return new IAxios(util.extend(true, {}, defaultIAxiosOptions, ops));
    }
    static createRequest(requestName, otherOptions) {
        return IAxios.map['default'].createRequest(requestName, otherOptions);
    }
    static setOptions(ops) {
        if (typeof ops === 'object') {
            util.validOptions(ops);
            util.standardFeaturesOptions(ops);
            util.extend(true, defaultIAxiosOptions, ops);
            IAxios.map['default'].setOptions(ops);
        }
    }
}
IAxios.map = {};

var defaultIAxios = IAxios.create();
defaultIAxios.id = 'default';
IAxios.map['default'] = defaultIAxios;

export default IAxios;

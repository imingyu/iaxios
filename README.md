# iaxios
[![Build Status](https://travis-ci.org/imingyu/iaxios.svg?branch=master)](https://travis-ci.org/imingyu/iaxios)
![image](https://img.shields.io/npm/l/iaxios.svg)
[![image](https://img.shields.io/npm/v/iaxios.svg)](https://www.npmjs.com/package/iaxios)
[![image](https://img.shields.io/npm/dt/iaxios.svg)](https://www.npmjs.com/package/iaxios)

使用axios库发送请求，并封装多组灵活的、高效的工具插件和配置规约

# 核心功能
- 使用axios库发送网络请求
- 使用Promise API
- 热插拔多组插件，包括：
    - 发送前认证用户
    - 发送前验证参数
    - 请求完成后convert response
    - 可使用jsonp方式发送请求（暂未实现）
- 可注册插件（暂未开放）
- 取消发送请求

# 待完善/添加的功能
- 更方便的区分`request error`，`checkResult reject`，`feature reject`
- 传给回调函数的参数丰富些
- 向外暴露类似生命周期的钩子函数

# 安装
```bash
npm i iaxios -S
```

# 使用
```javascript
//api-index.js
import iaxios from 'iaxios';
iaxios.options({
    requestConfigList: {
        "user.list": {
            url: 'http://xxx.com/user/list',
            method: 'get',
            auth: true,
            jsonp: false
        },
        "user.detail": {
            url: 'http://xxx.com/user/{id}',
            method: 'get',
            auth: true,
            jsonp: false
        }
    },
    features: {
        auth: {
            enabled: true,
            handler: function () {
                return !!localStorage.getItem('LoginUser');
            },
            onUnAuth: function () {
                alert('您还未登录，请登录！');
                location.href = "/user/login";
            }
        }
    }
});

//user-api.js
import iaxios from 'iaxios';
export var getList = iaxios.createRequest('user.list');
export var getModel = iaxios.createRequest('user.detail');


//page1.js（已登录）
import * as UserApi from 'user-api.js';
UserApi.getList({
    pageIndex: 1,
    pageSize: 10
}).then(list => {
    render(list);
}).catch(error => {
    console.log(error);
})

//page2.js（未登录）
import * as UserApi from 'user-api.js';
//发送前会检查登录情况，并弹出alert、跳转到登录页
UserApi.getModel({
    id: 1
}).then(model => {
    render(model);
}).catch(error => {
    console.log(error);
})

//page3.js（已登录）
import * as UserApi from 'user-api.js';
//假定请求发送需要10s后返回结果
var promise = UserApi.getList({
    pageIndex: 1,
    pageSize: 100000
}).then(list => {
    render(list);
}).catch(error => {
    console.log(error);
});

//2s后取消发送
setTimeout(()=>{
    promise.cancel('传递自定义数据');
    //执行后，promise.catch回调队列会接收到下面的数据格式：
    [
        {
            data:{
                message:'传递自定义数据'
            },
            stage:'cancel',
            state:'reject'
        }
    ]
})
```

# API
## createRequest (requestName, otherOptions)
- 创建并`返回一个函数`，这个函数用于发送请求；
- 返回的函数API及描述：
    - 结构：`fun(data, sendOptions)`
    - 发送前按照优先级合并配置（`mergeOptions`）：`sendOptions`，`otherOptions`，`options.requestConfigList[requestName]`，`defaultOptions`（由高到低）
    - `data`参数是请求要发送的数据
        - 如果`mergeOptions.method`的值为`get`，则会将`data`传递给`axios`的`parmas`配置项
        - 如果`mergeOptions.method`的值为`post`，则会将`data`传递给`axios`的`data`配置项
    - `sendOptions`允许你在发送前最后一次传递配置对象
    - 函数执行后返回一个`promise`对象
        - 本`promise`对象保函一个`cancel`方法，调用后可取消请求的发送
        - 请求发送取消后将会`reject`promise
    - 函数执行后即开始`前置步骤`：检查用户认证、验证参数等功能
        - 如果前置步骤`不通过`，直接`reject`掉`promise`，并且会将执行的结果发送给`mergeOptions.handlers.rejectConvert`进行处理，将处理结束后的数据传递给`reject`函数；
        - 如果前置步骤`通过`，则会执行发送请求
    - 发送请求前还会执行`mergeOptions.handlers.getUrl`函数，获取请求的url；如果不配置此项，则会从`mergeOptions.axios.url`读取
    - 请求发送成功后，执行`mergeOptions.handlers.checkResult`函数判断请求结果
        - 如果`mergeOptions.handlers.checkResult()==true || mergeOptions.handlers.checkResult().then`后调用`mergeOptions.handlers.resolveConvert`处理请求成功的`response`对象，`mergeOptions.handlers.resolveConvert`执行后，`resolve`掉`promise`，并将处理结果传递给`resolve`函数
        - 如果`mergeOptions.handlers.checkResult()==false || mergeOptions.handlers.checkResult().catch`后调用`mergeOptions.handlers.rejectConvert`处理请求成功的`response`对象，`mergeOptions.handlers.rejectConvert`执行后，`reject`掉`promise`，并将处理结果传递给`reject`函数
    - 请求发送失败，执行`mergeOptions.handlers.rejectConvert`，后续步骤类似

## setOptions (options)
- 设置当前`iaxios`实例的配置对象

## create (options)
- 创建一个`iaxios`实例，并传递配置对象
- 不同实例共享`iaxios`的`defaultOptions`，但使用实例方法`setOptions`后，设置的是本身的配置


## iaxios实例方法
- #createRequest
- #setOptions

# Options
```javascript
//options描述及默认配置
{
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
    validators: {},//验证器列表
    features: { //启用iaxios的哪些功能？
        auth: {
            enabled: false
        },
        jsonp: {
            enabled: false
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
```


# 更新日志
## v0.1.4
- 重构`options`的获取机制，在执行`request`发送时，`options`会做一次合并，后续所有配置均在此合并后的对象上读取，合并规则：
```javascript
var mergeOptions = util.extend(true, {}, iaxios.options, iaxios.options.requestConfigList[requestName], otherOptions, sendOptions);
```
- 删除`getOptionItem`方法
- 处理一些已知的BUG

## v0.1.3
- 为`handlers`的相关`convert`方法添加第二个参数`requestConfig`
- 更新文档：添加options注释
- 处理一些已知的BUG


## v0.1.0
- 核心功能实现
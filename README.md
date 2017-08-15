# iaxios
使用axios库发送请求，并封装多组灵活的、高效的工具插件和配置规约

# 核心功能
- 使用axios库发送网络请求
- 使用Promise API
- 热插拔多组插件，包括：
    - 发送前认证用户
    - 发送前验证参数
    - 请求完成后convert response
    - 可使用jsonp方式发送请求
- 可注册插件
- 取消发送请求

# 安装
```bash
npm i iaxios -S
```

## 使用
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
```

# API
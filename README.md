# iaxios
使用axios库发送请求，并封装多组灵活的、高效的工具插件和配置规约

> 代码未写，文档先行~~

## 安装
```bash
npm i iaxios -S
```

## 使用
```javascript
import iaxios from 'iaxios';

var requestOptions = {
    url: 'http://xxx.com/user/list',
    method:'get',
    auth:true
};
var request = iaxios.createRequest(requestOptions);
request().then(list=>{
})
```
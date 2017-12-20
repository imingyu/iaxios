var IAxios = require('../dist/iaxios')
var assert = require('chai').assert;

var orgOptionis = {
    requestConfigList: {
        'user.list': '/user/list',
        'user.add': {
            url: '/user/add',
            method: 'post'
        },
        'user.login': {
            url: '/user/login',
            method: 'post',
            features: {
                auth: false
            }
        },
        'user.update': {
            url: '/user/update',
            method: 'put'
        },
        'user.remove': {
            url: '/user/remove',
            method: 'delete'
        },
        'user.model': {
            url: '/user/{id}'
        },
        'user.format1': {
            url: '/user/{id}/{name}',
            method: 'post',
            features: {
                formatUrl: {
                    removeFormatedItem: ['name']
                }
            }
        },
        'user.format2': {
            url: '/user/{id}/{name}',
            method: 'post',
            features: {
                formatUrl: {
                    removeFormatedItem: {
                        id: true
                    }
                }
            }
        },
        'user.format3': {
            url: '/user/{id}/{name}',
            method: 'post',
            features: {
                formatUrl: {
                    removeFormatedItem: false
                }
            }
        }
    },
    features: {
        auth: {
            enabled: true,
            handler: function () {
                return true;
            }
        },
        jsonp: false,
        validator: false
    }
}
IAxios.setOptions(orgOptionis);


describe('options', () => {
    describe('getOptionItem', () => {
        var iaxios = IAxios.create();
        iaxios.setOptions({
            other1: '1',
            features2: '3'
        })
        it('getOptionItem.1', () => {
            assert.isObject(iaxios.options.requestConfigList["user.add"]);
        })
        it('getOptionItem.2', () => {
            var api = iaxios.options.requestConfigList["user.add"];
            assert.isTrue(api.url === orgOptionis.requestConfigList["user.add"].url);
            assert.isTrue(api.method === orgOptionis.requestConfigList["user.add"].method);
        })
    })
})

describe('auth', () => {
    it('auth.1', (done) => {
        var iaxios = IAxios.create();
        var UserApi = {};
        Object.keys(orgOptionis.requestConfigList).forEach(key => {
            UserApi[key.replace('user.', '')] = iaxios.createRequest(key);
        });

        var isLogin = false,
            execHandler = false,
            execOnUnAuth = false,
            execGetUrl = false;

        iaxios.setOptions({
            features: {
                auth: {
                    enabled: true,
                    handler() {
                        execHandler = true;
                        return isLogin;
                    },
                    onUnAuth() {
                        execOnUnAuth = true;
                    }
                }
            },
            handlers: {
                getUrl(config) {
                    execGetUrl = true;
                    return config.url;
                }
            }
        });
        UserApi.login({
            username: 'imingyu',
            password: '123456'
        }).then(data => {
            assert.isTrue(execGetUrl);
            assert.isTrue(!execOnUnAuth);
            assert.isTrue(!execHandler);
            done();
        }, data => {
            assert.isTrue(execGetUrl);
            assert.isTrue(!execOnUnAuth);
            assert.isTrue(!execHandler);
            done();
        }).catch(error => {
            assert.isTrue(false);
            done();
        })
    })
    describe('auth.2', () => {
        var iaxios = IAxios.create();
        var UserApi = {};
        Object.keys(orgOptionis.requestConfigList).forEach(key => {
            UserApi[key.replace('user.', '')] = iaxios.createRequest(key);
        });

        var isLogin = false,
            execHandler = false,
            execOnUnAuth = false,
            execGetUrl = false;

        iaxios.setOptions({
            features: {
                auth: {
                    enabled: true,
                    handler() {
                        execHandler = true;
                        return isLogin;
                    },
                    onUnAuth() {
                        execOnUnAuth = true;
                    }
                }
            },
            handlers: {
                getUrl(config) {
                    execGetUrl = true;
                    return config.url;
                }
            }
        });

        it('auth2.1', done => {
            UserApi.list({
                pageSize: 20
            }).then(data => {
                assert.isTrue(false);
                done();
            }, data => {
                assert.isTrue(execOnUnAuth);
                assert.isTrue(execHandler);
                assert.isTrue(!execGetUrl);
                done();
            }).catch(error => {
                assert.isTrue(false);
                done();
            })
        })

        it('auth2.2', done => {
            isLogin = true;
            UserApi.list({
                pageSize: 20
            }).then(data => {
                assert.isTrue(execGetUrl);
                done();
            }, data => {
                assert.isTrue(execGetUrl);
                done();
            }).catch(error => {
                assert.isTrue(false);
                done();
            })
        })
    })
})

describe('formatUrl', () => {
    it('formatUrl.1', done => {
        var iaxios = IAxios.create();
        var UserApi = {};
        Object.keys(orgOptionis.requestConfigList).forEach(key => {
            UserApi[key.replace('user.', '')] = iaxios.createRequest(key);
        });

        UserApi.model({
            id: 1
        }).catch(map => {
            var error = map.find(item => {
                return item.stage === 'sending.sender'
            }).data;
            assert.isTrue(error.config.url === '/user/1');
            done();
        })
    })
    it('formatUrl.2', done => {
        var iaxios = IAxios.create();
        var UserApi = {};
        Object.keys(orgOptionis.requestConfigList).forEach(key => {
            UserApi[key.replace('user.', '')] = iaxios.createRequest(key);
        });

        UserApi.format1({
            id: 1,
            name: 'Tom'
        }).catch(map => {
            var error = map.find(item => {
                return item.stage === 'sending.sender'
            }).data;
            assert.isTrue(error.config.url === '/user/1/Tom');
            assert.isTrue(error.config.data === 'id=1');
            done();
        })
    })
    it('formatUrl.3', done => {
        var iaxios = IAxios.create();
        var UserApi = {};
        Object.keys(orgOptionis.requestConfigList).forEach(key => {
            UserApi[key.replace('user.', '')] = iaxios.createRequest(key);
        });

        UserApi.format2({
            id: 1,
            name: 'Tom'
        }).catch(map => {
            var error = map.find(item => {
                return item.stage === 'sending.sender'
            }).data;
            assert.isTrue(error.config.url === '/user/1/Tom');
            assert.isTrue(error.config.data === 'name=Tom');
            done();
        })
    })
    it('formatUrl.4', done => {
        var iaxios = IAxios.create();
        var UserApi = {};
        Object.keys(orgOptionis.requestConfigList).forEach(key => {
            UserApi[key.replace('user.', '')] = iaxios.createRequest(key);
        });

        UserApi.format3({
            id: 1,
            name: 'Tom'
        }).catch(map => {
            var error = map.find(item => {
                return item.stage === 'sending.sender'
            }).data;
            assert.isTrue(error.config.url === '/user/1/Tom');
            assert.isTrue(error.config.data === 'id=1&name=Tom');
            done();
        })
    })
})
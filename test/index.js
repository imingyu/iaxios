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
        // it('getOptionItem.3', () => {
        //     var auth = iaxios.getOptionItem('requestConfigList["user.login"].features.auth');
        //     assert.isTrue(auth === false);
        // })
        // it('getOptionItem.4', () => {
        //     var auth = iaxios.getOptionItem('features.auth');
        //     assert.isTrue(auth.enabled);
        //     assert.isTrue(auth.handler === orgOptionis.features.auth.handler);
        // })
        // it('getOptionItem.4', () => {
        //     var item = iaxios.getOptionItem('features.jsonp');
        //     assert.isObject(item);
        //     assert.isTrue(item.enabled === false);
        // })
        // it('getOptionItem.5', () => {
        //     var item = iaxios.getOptionItem('other1');
        //     assert.isTrue(item === '1');
        // })
        // it('getOptionItem.6', () => {
        //     var item = iaxios.getOptionItem('features2');
        //     assert.isTrue(item === '3');
        // })
        // it('getOptionItem.7', () => {
        //     var item = iaxios.getOptionItem('features.');
        //     assert.isTrue(typeof item === 'undefined');
        // })
        // it('getOptionItem.8', () => {
        //     var item = iaxios.getOptionItem('requestConfigList.');
        //     assert.isTrue(typeof item === 'undefined');
        // })
        // it('getOptionItem.9', () => {
        //     var ins = IAxios.create();
        //     try {
        //         ins.setOptions({
        //             features: 123
        //         })
        //     } catch (error) {
        //         assert.isTrue(true);
        //     }

        //     var item = ins.getOptionItem('features.auth.enabled');
        //     assert.isTrue(item);
        // })
        // it('getOptionItem.10', () => {
        //     var ins = iaxios;
        //     orgOptionis.features.auth.enabled = false;
        //     var item = ins.getOptionItem('features.auth.enabled');
        //     assert.isTrue(item);

        //     item = ins.getOptionItem('features.auth.handler');
        //     assert.isTrue(item === orgOptionis.features.auth.handler);

        //     iaxios.setOptions({
        //         features: {
        //             auth: {
        //                 enabled: false
        //             }
        //         }
        //     })
        //     item = ins.getOptionItem('features.auth.enabled');
        //     assert.isTrue(item === false);
        // })
        // it('getOptionItem.11', () => {
        //     iaxios.setOptions({
        //         lk: 1,
        //         features: {
        //             auth: false
        //         }
        //     })
        //     item = iaxios.getOptionItem('features.auth.enabled');
        //     assert.isTrue(item === false);
        // })
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
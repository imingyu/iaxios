import IAxios from '../src/index.js';
import chai from 'chai';
var assert = chai.assert;

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

var instance = (name) => {
    var iaxios;
    if (name) {
        iaxios = IAxios.create();
        iaxios.id = name;
    } else {
        name = 'default';
        iaxios = IAxios.IAxios.map['default'];
    }

    var UserApi = {};
    Object.keys(orgOptionis.requestConfigList).forEach(key => {
        UserApi[key.replace('user.', '')] = iaxios.createRequest(key);
    });

    describe(`test instance:${name}`, () => {
        describe('options', () => {
            describe('getOptionItem', () => {
                it('getOptionItem.1', () => {
                    assert.isObject(iaxios.getOptionItem('requestConfigList["user.add"]'));
                })
                it('getOptionItem.2', () => {
                    var api = iaxios.getOptionItem('requestConfigList["user.add"]');
                    assert.isTrue(api.url === orgOptionis.requestConfigList["user.add"].url);
                    assert.isTrue(api.method === orgOptionis.requestConfigList["user.add"].method);
                })
                it('getOptionItem.3', () => {
                    var auth = iaxios.getOptionItem('requestConfigList["user.login"].features.auth');
                    assert.isTrue(auth === false);
                })
                it('getOptionItem.4', () => {
                    var auth = iaxios.getOptionItem('features.auth');
                    assert.isTrue(auth.enabled);
                    assert.isTrue(auth.handler === orgOptionis.features.auth.handler);
                })
                it('getOptionItem.4', () => {
                    var item = iaxios.getOptionItem('features.jsonp');
                    assert.isObject(item);
                    assert.isTrue(item.enabled === false);
                })
            })
        })

        describe('auth', () => {
            var isLogin = false,
                execHandler = false,
                execOnUnAuth = false,
                execGetUrl = false;
            iaxios.setOptions({
                features: {
                    auth: true,
                    handler() {
                        execHandler = true;
                        return isLogin;
                    },
                    onUnAuth() {
                        execOnUnAuth = true;
                    }
                },
                handlers: {
                    getUrl(config) {
                        execGetUrl = true;
                        return config.url;
                    }
                }
            });

            it('auth.1', (done) => {
                assert.isTrue(execOnUnAuth === false);
                assert.isTrue(execHandler === false);
                UserApi.login({
                    username: 'imingyu',
                    password: '123456'
                }).then(data => {
                    assert.isTrue(false);
                    done();
                }, data => {
                    assert.isTrue(execHandler);
                    assert.isTrue(execOnUnAuth);
                    done();
                }).catch(error => {
                    assert.isTrue(false);
                    done();
                })
            })
        })
    });
}

instance();
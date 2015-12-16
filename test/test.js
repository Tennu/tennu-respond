var assert = require('assert');
var Promise = require('bluebird');
var _ = require('lodash');
var client = require('./mock-client');
var dbcoreModule = require('tennu-dbcore');
// var errors = require('../lib/errors');

if (process.env.NODE_ENV === 'development') {
    dbcoreModule = require('../../tennu-dbcore/plugin.js');
}

var imports = {
    dbcore: dbcoreModule.init(client, null).exports
}

// init response
const dbResponsePromise = imports.dbcore.then(function(knex) {
    // response.js will return a promise as it fetches all responses
    return require('../lib/respond')(knex, client).then(function(respond) {
        return respond;
    });
});

var masterNickname = 'TheCreator';

describe('Respond', function() {

    // CLear and seed
    var clearAndSeed = (require('./before-each')(dbResponsePromise));
    beforeEach(clearAndSeed);

    describe('#add()', function() {
        describe('Valid add usage responses', function() {
            it('Should return 2 triggers and 1 response.', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.add(['a', 'b'], 'c', 0.03, 'TestUser')
                    })
                    .then(function(newResponse) {
                        assert.equal(newResponse.related('triggers').length, 2);
                        assert.equal(newResponse.get('response'), 'c');
                        done();
                    });
            });
            it('Accept string as trigger', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.add('d', 'e', 0.03, 'test_user')
                    })
                    .then(function(newResponse) {
                        assert.equal(newResponse.related('triggers').length, 1);
                        assert.equal(newResponse.get('response'), 'e');
                        done();
                    });
            });
        });
        describe('Invalid add usage', function() {
            describe('Invalid triggers', function() {
                it('Undefined trigger should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        respond.add(undefined, 'c', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(_.any(e.errors.trigger.errors, {
                                    rule: 'required'
                                }), true);
                            }).then(function() {
                                done();
                            });
                    });
                });
                it('Empty trigger in array should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return respond.add(['', 'b'], 'c', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(_.any(e.errors.trigger.errors, {
                                    rule: 'required'
                                }), true);
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
                it('null trigger in array should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return respond.add([null, 'b'], 'c', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(_.any(e.errors.trigger.errors, {
                                    rule: 'required'
                                }), true);
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
                it('Undefined trigger in array should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return respond.add([undefined, 'b'], 'c', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(_.any(e.errors.trigger.errors, {
                                    rule: 'required'
                                }), true);
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
                it('Numeric trigger in array should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return respond.add([42, 'b'], 'c', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.errors.trigger.message, 'Trigger must be a string or an array.');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
                it('Object trigger in array should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return respond.add([{}, 'b'], 'c', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.errors.trigger.message, 'Trigger must be a string or an array.');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
                it('Array trigger in array should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return respond.add([
                                [], 'b'
                            ], 'c', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.errors.trigger.message, 'Trigger must be a string or an array.');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
                it('Empty array trigger should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return respond.add([], 'p', 0.03, 'test_user')
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.toString(), 'Error: Array can not be empty.');
                            }).then(function() {
                                done();
                            });
                    });
                });
                it('Object trigger should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                        respond.add({}, 'c', 0.03, 'test_user').then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.errors.trigger.message, 'Trigger must be a string or an array.');
                            }).then(function() {
                                return respond.add({
                                    a: 'b'
                                }, 'c', 0.03, 'test_user');
                            })
                            .then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.errors.trigger.message, 'Trigger must be a string or an array.');
                            }).then(function() {
                                done();
                            });
                    });
                });
                it('Numeric trigger should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(42, 'c', 0.03, 'test_user');
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(e.errors.trigger.message, 'Trigger must be a string or an array.');
                        }).then(function() {
                            done();
                        });
                });
            });
            describe('Invalid response', function() {
                it('Empty string for response should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add('d', '', 0.03, 'test_user');
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.response.errors, {
                                rule: 'required'
                            }), true);
                        }).then(function() {
                            done();
                        });
                });
                it('Null response should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], null, 0.03, 'test_user');
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.response.errors, {
                                rule: 'required'
                            }), true);
                        }).then(function() {
                            done();
                        });
                });
                it('Undefined response should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], undefined, 0.03, 'test_user');
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.response.errors, {
                                rule: 'required'
                            }), true);
                        }).then(function() {
                            done();
                        });
                });
                it('Obgect response should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], {}, 0.03, 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(e.errors.response.message, 'Value must be a string.');
                        }).then(function() {
                            done();
                        });

                });
                it('Array response should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], [], 0.03, 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(e.errors.response.message, 'Value must be a string.');
                        }).then(function() {
                            done();
                        });

                });
            });
            describe('Invalid chance', function() {
                it('Undefined chance should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', undefined, 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.chance.errors, {
                                rule: 'required'
                            }), true);
                        }).then(function() {
                            done();
                        });

                });
                it('Null chance should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', null, 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.chance.errors, {
                                rule: 'required'
                            }), true);
                        }).then(function() {
                            done();
                        });

                });
                it('Empty string chance should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', '', 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.chance.errors, {
                                rule: 'required'
                            }), true);
                        }).then(function() {
                            done();
                        });

                });
                it('Object chance should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', {}, 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.chance.errors, {
                                rule: 'numeric'
                            }), true);
                        }).then(function() {
                            done();
                        });

                });
                it('Array chance should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', [], 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.chance.errors, {
                                rule: 'numeric'
                            }), true);
                        }).then(function() {
                            done();
                        });

                });
                it('Chance numeric under 0.0 should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', -0.000001, 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(e.errors.chance.message, 'The chance must be a number greater than or equal to 0');
                        }).then(function() {
                            done();
                        });
                });
                it('Chance numeric over 1.0 should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', 1.0000001, 'test_user')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(e.errors.chance.message, 'The chance must be a number less than or equal to 1');
                        }).then(function() {
                            done();
                        });
                });
            });
            describe('Invalid created_by', function() {
                it('Empty created_by should throw', function(done) {
                    dbResponsePromise.then(function(respond) {
                            return respond.add(['a', 'b'], 'c', 0.03, '')
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(_.any(e.errors.created_by.errors, {
                                rule: 'required'
                            }), true);
                            done();
                        });

                });
            });
        });
    });

    describe('emit', function() {
        it('Should emit trigger when inserted at 100%');
    });

    describe('details', function() {
        it('Should return details for a response');
        it('Should return details for a trigger');
    });

    describe('delete', function() {
        it('Should delete response when only trigger is deleted');
        it('Should delete all triggers when response is deleted');
    });

    describe('cache-integration', function() {

        var cache = require('../lib/cache');

        describe('seed population', function() {
            it('Trigger cache should reflect clear and seed', function() {
                assert.equal(cache.triggerCache.length, 6);
            });
        });

        it('Adding response should add to cache');
        it('Removing response should remove from cache');
        it('Updating response should update same response in cache');

    });

});


describe('Cache', function() {

    var cache = require('../lib/cache');

    var itemPromise = dbResponsePromise.then(function(respond) {
        return new respond.Trigger({
            trigger: 'Hello World',
            chance: 0.03,
            created_by: masterNickname
        });
    });

    describe('#add()', function() {
        it('Should add cache item', function(done) {
            itemPromise.then(function(item) {
                var beginingLength = cache.triggerCache.length;
                cache.add(item);
                assert.equal(beginingLength, cache.triggerCache.length - 1);
                done();
            });
        });
    });

    describe('#update()', function() {
        it('Should update cache item', function(done) {
            itemPromise.then(function(item) {
                item.set('trigger', 'Hello Mars');
                cache.update(item);
                assert.deepEqual({
                    trigger: 'Hello Mars',
                    chance: 0.03,
                    created_by: masterNickname
                }, cache.triggerCache[6].toJSON());
                done();
            });
        });
    });

    describe('#remove()', function() {
        it('Should remove cache item', function(done) {
            itemPromise.then(function(item) {
                var beginingLength = cache.triggerCache.length;
                cache.remove(item);
                assert.equal(beginingLength, cache.triggerCache.length + 1);
                done();
            });
        });
    });

    describe('#clear()', function() {
        it('Should clear the triggerCache', function() {
            cache.clear();
            assert.equal(cache.triggerCache.length, 0);
        });
    });

});
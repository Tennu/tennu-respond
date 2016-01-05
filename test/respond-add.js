var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');

var responseAddTests = function(dbResponsePromise) {
    describe('#addTrigger()', function() {

        describe('Valid usage', function() {
            it('Should return 2 triggers and 1 response', function(done) {
                var created_by = 'TestUser';
                dbResponsePromise.then(function(respond) {
                        return respond.add(['a', 'b'], 'c', 0.03, created_by);
                    })
                    .then(function(newResponse) {

                        // Response
                        assert.equal(newResponse.response, 'c');
                        assert.equal(newResponse.created_by, created_by);
                        assert.equal(_.isNull(newResponse.updated_at), false);
                        assert.equal(_.isNull(newResponse.created_at), false);

                        // triggers
                        assert.equal(newResponse.triggers[0].response_id, newResponse.id);
                        assert.equal(newResponse.triggers[0].trigger, 'a');
                        assert.equal(newResponse.triggers[0].created_by, created_by);
                        assert.equal(_.isNull(newResponse.triggers[0].updated_at), false);
                        assert.equal(_.isNull(newResponse.triggers[0].created_at), false);
                        assert.equal(_.isNumber(newResponse.triggers[0].chance), true);

                        assert.equal(newResponse.triggers[1].response_id, newResponse.id);
                        assert.equal(newResponse.triggers[1].trigger, 'b');
                        assert.equal(newResponse.triggers[1].created_by, created_by);
                        assert.equal(_.isNull(newResponse.triggers[1].updated_at), false);
                        assert.equal(_.isNull(newResponse.triggers[1].created_at), false);
                        assert.equal(_.isNumber(newResponse.triggers[1].chance), true);

                        done();
                    });
            });
            it('Accept string as trigger', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.add('d', 'e', 0.03, 'test_user');
                    })
                    .then(function(newResponse) {
                        assert.equal(newResponse.triggers[0].trigger, 'd');
                        done();
                    });
            });
            it('Refetch should confirm add', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                        return respond.add(['f', 'g'], 'h', 0.03, 'test_user');
                    }).then(function(newResponseJSON) {
                        return new respond.Response({
                            id: newResponseJSON.id
                        })
                        .fetch({
                            require: true,
                            withRelated: 'triggers'
                        });
                    }).then(function(newResponse){
                        assert(newResponse.related('triggers'), 2);
                        done();
                    });
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
                                assert.equal(e.type, 'respond.triggerarrayempty');
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
                            return respond.add(['a', 'b'], {}, 0.03, 'test_user');
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
                            return respond.add(['a', 'b'], [], 0.03, 'test_user');
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
                            return respond.add(['a', 'b'], 'c', undefined, 'test_user');
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
                            return respond.add(['a', 'b'], 'c', null, 'test_user');
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
                            return respond.add(['a', 'b'], 'c', '', 'test_user');
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
                            return respond.add(['a', 'b'], 'c', {}, 'test_user');
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
                            return respond.add(['a', 'b'], 'c', [], 'test_user');
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
                            return respond.add(['a', 'b'], 'c', -0.000001, 'test_user');
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
                            return respond.add(['a', 'b'], 'c', 1.0000001, 'test_user');
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
                            return respond.add(['a', 'b'], 'c', 0.03, '');
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
};

module.exports = responseAddTests;
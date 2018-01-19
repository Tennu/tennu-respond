var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');

var responseEditTests = function(dbResponsePromise) {
    describe('#edit()', function() {

        /*
         Note on validating params
         
         By the time we get here we already know that not providing chance, or trigger/response text will throw errors.
         
         Same with provided invalid values.
         
         This is because all validation is done against model properties using the hooks provided by bookshelf.
         
         id property bring bogus but valid will also fail due to bookshelfs require option as tested by #remove();
         
        */

        describe('Editing a response', function() {

            describe('Valid usage', function() {

                it('Should return updated response', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            return new respond.Response({
                                'response': 'response two'
                            }).fetch({
                                require: true
                            });
                        }).then(function(response) {
                            return Promise.try(function() {
                                return respond.edit('response', response.id, 'custom response two');
                            }).then(function(modifiedReponse) {
                                assert.equal(modifiedReponse.id, response.id);
                                assert.equal(modifiedReponse.response, 'custom response two');
                                assert.equal(_.isUndefined(modifiedReponse.updated_at), false);
                            });
                        }).then(function() {
                            done();
                        });
                    });
                });

                it('Should update a response', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            return new respond.Response({
                                'response': 'response three'
                            }).fetch({
                                require: true
                            });
                        }).then(function(response) {
                            return respond.edit('response', response.id, 'custom response three');
                        }).then(function(modifiedReponse) {

                            return new respond.Response({
                                'response': 'custom response three'
                            }).fetch({
                                require: true
                            }).then(function(model) {
                                assert.ok(model);
                            });

                        }).then(function() {
                            done();
                        });
                    });
                });

            });

            describe('Invalid usage', function() {

                it('Should throw when bogus response id provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return respond.edit('response', -1, 'Hello World');
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.message, 'No Rows Updated');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

                it('Should throw when empty response string provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response three'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                return respond.edit('response', response.id, '');
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(_.some(e.errors.response.errors, {
                                    rule: 'required'
                                }), true);
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

                it('Should throw when undefined response string provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response three'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                return respond.edit('response', response.id, undefined);
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(_.some(e.errors.response.errors, {
                                    rule: 'required'
                                }), true);
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

                it('Should throw when null response string provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response three'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                return respond.edit('response', response.id, null);
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(_.some(e.errors.response.errors, {
                                    rule: 'required'
                                }), true);
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

                it('Should throw when object response string provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response three'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                return respond.edit('response', response.id, {});
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.errors.response.message, 'Value must be a string.');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

                it('Should throw when array response string provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response three'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                return respond.edit('response', response.id, []);
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.errors.response.message, 'Value must be a string.');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

            });

        });

        describe('editing a trigger', function() {

            describe('Valid usage', function() {

                it('Should return updated trigger', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            return new respond.Trigger({
                                'trigger': 'trigger one'
                            }).fetch({
                                require: true
                            });
                        }).then(function(trigger) {
                            return Promise.try(function() {
                                return respond.edit('trigger', trigger.id, 'custom trigger one', 0.69);
                            }).then(function(modifiedTrigger) {
                                assert.equal(modifiedTrigger.id, trigger.id);
                                assert.equal(modifiedTrigger.trigger, 'custom trigger one');
                                assert.equal(modifiedTrigger.chance, 0.69);
                                assert.equal(_.isUndefined(modifiedTrigger.updated_at), false);
                            });
                        }).then(function() {
                            done();
                        });
                    });
                });

                it('Should return updated trigger when chance ommited and use existing chance', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            return new respond.Trigger({
                                'trigger': 'trigger one'
                            }).fetch({
                                require: true
                            });
                        }).then(function(trigger) {
                            return Promise.try(function() {
                                return respond.edit('trigger', trigger.id, 'custom trigger one');
                            }).then(function(modifiedTrigger) {
                                assert.equal(modifiedTrigger.id, trigger.id);
                                assert.equal(modifiedTrigger.trigger, 'custom trigger one');
                                assert.equal(modifiedTrigger.chance, 0.03);
                                assert.equal(_.isUndefined(modifiedTrigger.updated_at), false);
                            });
                        }).then(function() {
                            done();
                        });
                    });
                });


                it('Should update a trigger', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            return new respond.Trigger({
                                'trigger': 'trigger one'
                            }).fetch({
                                require: true
                            });
                        }).then(function(trigger) {
                            return respond.edit('trigger', trigger.id, 'custom trigger one');
                        }).then(function() {

                            return new respond.Trigger({
                                'trigger': 'custom trigger one'
                            }).fetch({
                                require: true
                            }).then(function(model) {
                                assert.ok(model);
                            });

                        }).then(function() {
                            done();
                        });
                    });
                });
            });

            describe('Invalid usage', function() {

                it('Should throw when bogus trigger id provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return respond.edit('trigger', -1, 'Hello World');
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.message, 'EmptyResponse');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

                it('Should throw "No Rows Updated" when bogus trigger id provided and chance provided', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return respond.edit('trigger', -1, 'Hello World', 1.0);
                            }).then(assert.fail)
                            .catch(function(e) {
                                assert.equal(e.message, 'No Rows Updated');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });

            });

        });

    });
};

module.exports = responseEditTests;
var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');

var responseRemoveTests = function(dbResponsePromise) {
    describe('#remove()', function() {

        describe('Invalid remove usage', function() {
            it('Invalid type should throw', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.remove('', 42);
                    })
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(e.type, 'respond.typeinvalid');
                        done();
                    });
            });
            it('Invalid id should throw', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.remove('response', -42);
                    })
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(e.message, 'EmptyResponse');
                        done();
                    });
            });
        });

        describe('Valid remove usage', function() {
            it('Should return deleted response and related triggers', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                        return new respond.Response({
                            'response': 'response one'
                        }).fetch();
                    }).then(function(response) {
                        return respond.remove('response', response.get('id'));
                    }).then(function(deletedReponse) {

                        // Response
                        assert.equal(deletedReponse.response, 'response one');
                        assert.equal(deletedReponse.created_by, 'TestUser');
                        assert.equal(_.isNull(deletedReponse.updated_at), false);
                        assert.equal(_.isNull(deletedReponse.created_at), false);

                        // triggers
                        assert.equal(deletedReponse.triggers[0].response_id, deletedReponse.id);
                        assert.equal(deletedReponse.triggers[0].trigger, 'trigger one');
                        assert.equal(deletedReponse.triggers[0].created_by, 'TestUser2');
                        assert.equal(deletedReponse.triggers[0].chance, 0.03);
                        assert.equal(_.isNull(deletedReponse.triggers[0].updated_at), false);
                        assert.equal(_.isNull(deletedReponse.triggers[0].created_at), false);

                        assert.equal(deletedReponse.triggers[1].response_id, deletedReponse.id);
                        assert.equal(deletedReponse.triggers[1].trigger, 'trigger two');
                        assert.equal(deletedReponse.triggers[1].created_by, 'TestUser2');
                        assert.equal(deletedReponse.triggers[1].chance, 0.43);
                        assert.equal(_.isNull(deletedReponse.triggers[1].updated_at), false);
                        assert.equal(_.isNull(deletedReponse.triggers[1].created_at), false);

                        assert.equal(deletedReponse.triggers[2].response_id, deletedReponse.id);
                        assert.equal(deletedReponse.triggers[2].trigger, 'trigger three');
                        assert.equal(deletedReponse.triggers[2].created_by, 'TestUser2');
                        assert.equal(deletedReponse.triggers[2].chance, 0.93);
                        assert.equal(_.isNull(deletedReponse.triggers[2].updated_at), false);
                        assert.equal(_.isNull(deletedReponse.triggers[2].created_at), false);

                    });

                }).then(function() {
                    done();
                });

            });
            it('Should have actually deleted response and related triggers', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                            return new respond.Response({
                                'response': 'response one'
                            }).fetch();
                        }).then(function(response) {
                            return respond.remove('response', response.get('id'));
                        }).then(function(deletedResponse) {
                            return new respond.Response({
                                'id': deletedResponse.id
                            }).fetch({
                                require: true
                            });
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(e.message, 'EmptyResponse');
                        });

                    // Database integrity would never have let us delete a response and not the triggers
                    // No need to test for missing triggers

                }).then(function() {
                    done();
                });
            });
            it('Should delete trigger and return deleted trigger', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                            return new respond.Trigger({
                                trigger: 'trigger four'
                            }).fetch();
                        }).then(function(trigger) {
                            return respond.remove('trigger', trigger.id);
                        })
                        .then(function(deletedTrigger) {

                            assert.equal(deletedTrigger.trigger.trigger, 'trigger four');
                            assert.equal(deletedTrigger.trigger.created_by, 'TestUser3');
                            assert.equal(deletedTrigger.trigger.chance, 0.01);
                            assert.equal(_.isNull(deletedTrigger.trigger.updated_at), false);
                            assert.equal(_.isNull(deletedTrigger.trigger.created_at), false);

                            // No response should have been deleted
                            assert.equal(_.isUndefined(deletedTrigger.response), true);

                            return deletedTrigger;
                        })
                        .then(function(deletedTrigger) {
                            return new respond.Trigger({
                                    id: deletedTrigger.id
                                })
                                .fetch({
                                    require: true
                                });
                        })
                        .then(assert.fail)
                        .catch(function(e) {
                            assert.equal(e.message, 'EmptyResponse');
                        })
                        .then(function() {
                            done();
                        });
                });
            });
            it('Should NOT delete response when response would NOT have been orphaned.', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                            return new respond.Trigger({
                                trigger: 'trigger four'
                            }).fetch({
                                require: true
                            });
                        }).then(function(trigger) {
                            return respond.remove('trigger', trigger.id);
                        })
                        .then(function(deletedTrigger) {
                            return new respond.Response({
                                    id: deletedTrigger.trigger.response_id
                                })
                                .fetch({
                                    require: true
                                });
                        })
                        .then(function(response) {
                            assert.equal(_.isUndefined(response), false);
                        })
                        .then(function() {
                            done();
                        });
                });
            });
            it('Should also delete response when response would have been orphaned (deleting responses only trigger).', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                            return new respond.Trigger({
                                trigger: 'trigger six'
                            }).fetch();
                        }).then(function(trigger) {
                            return respond.remove('trigger', trigger.id);
                        })
                        .then(function(deletedTrigger) {

                            assert.equal(deletedTrigger.trigger.trigger, 'trigger six');
                            assert.equal(deletedTrigger.trigger.created_by, 'TestUser4');
                            assert.equal(deletedTrigger.trigger.chance, 0.01);
                            assert.equal(_.isNull(deletedTrigger.trigger.updated_at), false);
                            assert.equal(_.isNull(deletedTrigger.trigger.created_at), false);

                            assert.equal(deletedTrigger.response.response, 'response three');
                            assert.equal(deletedTrigger.response.created_by, 'TestUser');
                            assert.equal(_.isNull(deletedTrigger.response.updated_at), false);
                            assert.equal(_.isNull(deletedTrigger.response.created_at), false);

                            return Promise.try(function() {
                                    return new respond.Trigger({
                                            id: deletedTrigger.trigger.id
                                        })
                                        .fetch({
                                            require: true
                                        });
                                }).then(assert.fail)
                                .catch(function(e) {
                                    assert.equal(e.message, 'EmptyResponse');
                                }).then(function() {
                                    return new respond.Response({
                                            id: deletedTrigger.trigger.response_id
                                        })
                                        .fetch({
                                            require: true
                                        });
                                }).catch(function(e) {
                                    assert.equal(e.message, 'EmptyResponse');
                                });
                        })
                        .then(function() {
                            done();
                        });
                });
            });
        });
    });
};

module.exports = responseRemoveTests;
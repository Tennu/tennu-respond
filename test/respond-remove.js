var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');

var responseRemoveTests = function(dbResponsePromise) {
    describe('#remove()', function() {

        describe('Invalid remove usage', function() {
            it('Invalid id should throw', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.removeResponse(-42);
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
                        return respond.removeResponse(response.get('id'));
                    }).then(function(deletedReponse) {

                        // MySQL is returning my decimal as a string. So this will patch sqlite and mysql.
                        _.each(deletedReponse.triggers, function(trigger) {
                            trigger.chance = parseFloat(trigger.chance);
                        });

                        // Response
                        assert.equal(deletedReponse.response, 'response one');
                        assert.equal(deletedReponse.created_by, 'TestUser');
                        assert.equal(_.isNull(deletedReponse.updated_at), false);
                        assert.equal(_.isNull(deletedReponse.created_at), false);

                        assert.equal(_.any(_.map(deletedReponse.triggers, function(trigger) {
                            return _.omit(trigger, ['updated_at', 'created_at'])
                        }), {
                            "response_id": deletedReponse.id,
                            "trigger": "trigger one",
                            "created_by": "TestUser2",
                            "chance": 0.03,
                        }), true);
                        
                        assert.equal(_.any(_.map(deletedReponse.triggers, function(trigger) {
                            return _.omit(trigger, ['updated_at', 'created_at'])
                        }), {
                            "response_id": deletedReponse.id,
                            "trigger": "trigger two",
                            "created_by": "TestUser2",
                            "chance": 0.43,
                        }), true);
                        
                        assert.equal(_.any(_.map(deletedReponse.triggers, function(trigger) {
                            return _.omit(trigger, ['updated_at', 'created_at'])
                        }), {
                            "response_id": deletedReponse.id,
                            "trigger": "trigger three",
                            "created_by": "TestUser2",
                            "chance": 0.93,
                        }), true);

                        var createdAtValues = _.pluck(deletedReponse.triggers, 'created_at');
                        var updatedAtValues = _.pluck(deletedReponse.triggers, 'updated_at');

                        assert.equal(createdAtValues.length, 3);
                        assert.equal(updatedAtValues.length, 3);

                        assert.equal(_.any(createdAtValues, _.isUndefined), false);
                        assert.equal(_.any(updatedAtValues, _.isUndefined), false);

                        assert.equal(_.any(createdAtValues, _.isNull), false);
                        assert.equal(_.any(updatedAtValues, _.isNull), false);

                        done();

                    });

                });

            });
            it('Should have actually deleted response and related triggers', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                            return new respond.Response({
                                'response': 'response one'
                            }).fetch();
                        }).then(function(response) {
                            return respond.removeResponse(response.get('id'));
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
                            return respond.removeTrigger(trigger.id);
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
                            return respond.removeTrigger(trigger.id);
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
                            return respond.removeTrigger(trigger.id);
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
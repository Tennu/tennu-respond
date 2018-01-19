var assert = require("assert");
var Promise = require("bluebird");
var _ = require("lodash");
var cache = require('../lib/cache');

var respondCacheIntegration = function(dbResponsePromise) {
    describe('respond-cache integration', function() {

        describe('seed population', function() {
            it('Trigger cache should reflect clear and seed', function() {
                assert.equal(cache.triggerCache.length, 6);
            });
        });

        describe('Operations made by respond should affect cache', function() {
            describe('#add()', function() {
                it('Should add triggers to cache', function(done) {
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
                        }).then(function(newResponse) {

                            var jsonTriggers = newResponse.related('triggers').toJSON();

                            // Map for mysql returning strings.
                            _.each(jsonTriggers, function(trigger) {
                                trigger.chance = parseFloat(trigger.chance)
                            });
                            _.each(cache.triggerCache, function(trigger) {
                                trigger.set('chance', parseFloat(trigger.get('chance')));
                            });

                            return Promise.filter(cache.triggerCache, function(trigger) {
                                return _.some(jsonTriggers, {
                                    "id": trigger.get('id'),
                                    "trigger": trigger.get('trigger'),
                                    "chance": trigger.get('chance'),
                                    "response_id": trigger.get('response_id'),
                                    "created_by": trigger.get('created_by'),
                                });
                            });

                        }).then(function(triggerCacheMatches) {
                            assert.equal(triggerCacheMatches.length, 2);
                            done();
                        });
                    });
                });
            });
            describe('#addTriggers()', function() {
                it('Should add triggers to cache', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                return respond.add(['h', 'i'], 'j', 0.03, 'test_user');
                            }).then(function(newResponseJSON) {
                                return respond.addTriggers(newResponseJSON.id, ['k', 'l'], 0.29, 'test_user_2');
                            })
                            .then(function(newResponseJSON) {
                                return new respond.Response({
                                        id: newResponseJSON.id
                                    })
                                    .fetch({
                                        require: true,
                                        withRelated: 'triggers'
                                    });
                            })
                            .then(function(newResponse) {

                                var jsonTriggers = newResponse.related('triggers').toJSON();

                                // Map for mysql returning strings.
                                _.each(jsonTriggers, function(trigger) {
                                    trigger.chance = parseFloat(trigger.chance)
                                });
                                _.each(cache.triggerCache, function(trigger) {
                                    trigger.set('chance', parseFloat(trigger.get('chance')));
                                });

                                // Return all cache.triggerCache that exist in jsonTriggers
                                return Promise.filter(cache.triggerCache, function(trigger) {
                                    return _.some(jsonTriggers, {
                                        id: trigger.get('id'),
                                        trigger: trigger.get('trigger'),
                                        chance: trigger.get('chance'),
                                        response_id: trigger.get('response_id'),
                                        created_by: trigger.get('created_by'),
                                    });
                                });

                            }).then(function(triggerCacheMatches) {
                                assert.equal(triggerCacheMatches.length, 4);
                                done();
                            });
                    });
                });
            });
            describe('#remove()', function() {
                it('Should remove all triggers from cache when response deleted', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            //  'response one' exists from seed method. seed already tested by this point.
                            return new respond.Response({
                                'response': 'response one'
                            }).fetch();
                        }).then(function(response) {
                            var responseId = response.get('id');
                            return Promise.try(function() {
                                return respond.removeResponse(response.get('id'));
                            }).then(function(deletedReponse) {
                                // We shouldt find ANY triggers that match the deleted response_id.
                                assert.equal(_.some(cache.triggerCache, 'response_id', responseId), false);
                                done();
                            });
                        })
                    });
                });
                it('Should remove trigger from cache when only one trigger deleted', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            //  'response one' exists from seed method. seed already tested by this point.
                            return new respond.Trigger({
                                trigger: 'trigger four'
                            }).fetch();
                        }).then(function(trigger) {
                            var triggerId = trigger.id;
                            return Promise.try(function() {
                                return respond.removeTrigger(triggerId);
                            }).then(function(deletedTrigger) {
                                // We shouldt find ANY triggers that match the deleted response_id.
                                assert.equal(_.some(_.map(cache.triggerCache, 'id'), deletedTrigger), false);
                                done();
                            });
                        })
                    });
                });
            });
            describe('#edit()', function() {
                it('Should edit a trigger in cache', function(done) {
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
                                return Promise.filter(cache.triggerCache, function(trigger) {
                                    return trigger.toJSON();
                                });
                            }).then(function(cacheAsJSON) {
                                assert.equal(_.some(cache.triggerCache, 'trigger', cacheAsJSON.trigger), true);
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
}

module.exports = respondCacheIntegration;
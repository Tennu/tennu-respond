var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');

var responseAddTests = function(dbResponsePromise) {
    describe('#addTriggers()', function() {

        describe('Valid usage', function() {
            it('Should return 2 triggers and 1 response.', function(done) {
                var created_by = 'TestUser';
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                        return respond.add('a', 'c', 0.04, created_by);
                    }).then(function(newResponse) {
                        return respond.addTriggers(newResponse.id, 'b', 0.04, created_by);
                    }).then(function(addTriggerResult) {
                        // triggers
                        assert.equal(addTriggerResult.triggers[0].response_id, addTriggerResult.id);
                        assert.equal(addTriggerResult.triggers[0].trigger, 'a');
                        assert.equal(addTriggerResult.triggers[0].created_by, created_by);
                        assert.equal(addTriggerResult.triggers[0].chance, 0.04);
                        assert.equal(_.isNull(addTriggerResult.triggers[0].updated_at), false);
                        assert.equal(_.isNull(addTriggerResult.triggers[0].created_at), false);

                        assert.equal(addTriggerResult.triggers[1].response_id, addTriggerResult.id);
                        assert.equal(addTriggerResult.triggers[1].trigger, 'b');
                        assert.equal(addTriggerResult.triggers[1].created_by, created_by);
                        assert.equal(addTriggerResult.triggers[1].chance, 0.04);
                        assert.equal(_.isNull(addTriggerResult.triggers[1].updated_at), false);
                        assert.equal(_.isNull(addTriggerResult.triggers[1].created_at), false);
                        assert.equal(_.isNumber(addTriggerResult.triggers[1].chance), true);

                        assert.equal(_.isEqual(_.omit(addTriggerResult, ['created_at', 'updated_at', 'triggers']), {
                            id: addTriggerResult.id,
                            response: addTriggerResult.response,
                            executable: 0,
                            created_by: addTriggerResult.created_by
                        }), true);

                        done();
                    });

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
        });
    });
};

module.exports = responseAddTests;
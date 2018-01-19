var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');

var responseAddTests = function(dbResponsePromise) {
    describe('#tryEmit()', function() {

        describe('Valid usage', function() {
            it('Should return hits when 100% chance trigger hits', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                        return respond.add('custom', 'c', 1.00, 'TestUser');
                    }).then(function(newResponse) {
                        return Promise.try(function() {
                                return respond.tryEmit('hello my custom world.');
                            }).then(function(hits) {
                                assert.equal(hits.length, 1);
                                assert.deepEqual(_.omit(hits[0], ['created_at', 'updated_at', 'executable']), {
                                    id: newResponse.id,
                                    response: 'c',
                                    created_by: 'TestUser'
                                });
                            })
                            .catch(assert.fail)
                            .then(function() {
                                done();
                            });
                    });
                });
            });
            it('Should throw when 0% chance trigger called', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                        return respond.add('custom', 'c', 0.00, 'TestUser');
                    }).then(function(newResponse) {
                        return Promise.try(function() {
                                return respond.tryEmit('hello my custom world.');
                            })
                            .then(assert.fail)
                            .catch(function(err){
                                assert.equal(err.type, 'respond.notriggerpassedchancecheck');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
            });
            it('Should throw when no trigger matches the message content', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.tryEmit('hello my custom world.');
                    }).then(assert.fail)
                    .catch(function(e) {
                        assert.equal(e.type, 'respond.notrigger');
                    })
                    .then(function() {
                        done();
                    });
            });
        });
        describe('Valid usage', function() {
            it('Should fail when null provided as message.', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.tryEmit(null);
                    })
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(e.message, 'message must be a valid string');
                        done();
                    });
            });
            it('Should fail when undefined provided as message.', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.tryEmit(undefined);
                    })
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(e.message, 'message must be a valid string');
                        done();
                    });
            });
            it('Should fail when object provided as message.', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.tryEmit({});
                    })
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(e.message, 'message must be a valid string');
                        done();
                    });
            });
            it('Should fail when array provided as message.', function(done) {
                dbResponsePromise.then(function(respond) {
                        return respond.tryEmit([]);
                    })
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(e.message, 'message must be a valid string');
                        done();
                    });
            });
        });
    });
};

module.exports = responseAddTests;
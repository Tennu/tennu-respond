var assert = require("assert");

var responseGetAllTests = function(dbResponsePromise) {
    describe('#getAll()', function() {
        it('Should return all responses and tells in the database', function(done) {
            dbResponsePromise.then(function(respond) {
                    return respond.getAll();
                })
                .then(function(allResponsesAndTriggers) {
                    assert.equal(allResponsesAndTriggers[0].triggers.length, 3);
                    assert.equal(allResponsesAndTriggers[1].triggers.length, 2);
                    assert.equal(allResponsesAndTriggers[2].triggers.length, 1);
                })
                .then(function() {
                    done();
                });
        });
    });
};

module.exports = responseGetAllTests;
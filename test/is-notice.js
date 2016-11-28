var assert = require("assert");
var _ = require("lodash");

function isNotice(object) {
    assert.equal(_.isEqual(_.omit(object, 'message'), {
        intent: 'notice',
        query: true
    }), true, 'Object recieved back is NOT a tennu notice response');
}

module.exports = isNotice;
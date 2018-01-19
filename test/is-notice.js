var assert = require("assert");
var _ = require("lodash");

function isNotice(object) {
    assert.equal(_.isEqual(_.omit(object, ['message', 'executable']), {
        intent: 'notice',
        query: true
    }), true, 'Expected a tennu response back.');
}

module.exports = isNotice;
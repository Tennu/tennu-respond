var assert = require('assert');
var _ = require('lodash');

function logger() {
    return {
        "notice": function(text) {
            //console.info(text);
        },
        "debug": function(text) {
            //console.info(text);
        },
        "error": function(text) {
            //console.error('ERROR SENT TO TENNU_CLIENT._LOGGER.ERROR');
        }
    }
}

function config(value) {
    var cfg = {
        "respond": {
            "defaultChance": 0.3,
            "no-admin": true,
        },
        "database": {
            "client": "sqlite3",
            "debug": false,
            "connection": {
                "filename": "./test/Respond.tests.sqlite"
            }
        }
    };
    return cfg[value];
}

function makeParamFilledAssertions(target, messages) {
    assert.equal(_.isNull(target), false);
    assert.equal(_.isEmpty(target), false);
    assert.equal(_.isUndefined(target), false);
    assert.equal(_.isNull(messages), false);
    assert.equal(_.isEmpty(messages), false);
    assert.equal(_.isUndefined(messages), false);
}

function say(target, messages) {
    makeParamFilledAssertions(target, messages);
}

function act(target, messages) {
    makeParamFilledAssertions(target, messages);
}

function notice(target, messages) {
    makeParamFilledAssertions(target, messages);
}

module.exports = {
    "config": config,
    "_logger": logger(),
    "say": say,
    "act": act,
    "notice": notice
};
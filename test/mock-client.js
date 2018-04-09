var assert = require('assert');
var _ = require('lodash');

var clientConfiguration = {
    "admin-failed-attempt-response": "Permission denied.",
    "admins": [{
        "hostname": "admin.admin.admin"
    }],
    "respond": {
        "defaultChance": 0.3,
        "hastebin-server": "https://hastebin.com/",
        "no-admin": true,
    },
    "database": {
        "client": "sqlite3",
        "debug": true,
        "connection": {
            "filename": "./test/Respond.tests.sqlite"
        }
    }
};

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
    if(this.pluginDefaultConfig) {
        return _.assign(clientConfiguration[value], this.pluginDefaultConfig.respond);
    }
    return clientConfiguration[value];
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
    "clientConfiguration": clientConfiguration,
    "_logger": logger(),
    "say": say,
    "act": act,
    "notice": notice,
    "error": logger().error,
    "note": logger().notice,
    "debug": logger().debug
};

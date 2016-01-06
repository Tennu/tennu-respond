var Promise = require('bluebird');

var client = require('./mock-client');
var dbcoreModule = require('tennu-dbcore');

var respondTests = require("./respond");
var cacheTests = require("./cache");
var respondCacheIntegrationTests = require("./respond-cache-integration");
var pluginRespondIntegrationTests = require("./plugin-respond-integration");
var variableFormatTests = require('./variable-format');

if (process.env.NODE_ENV === 'development') {
    dbcoreModule = require('../../tennu-dbcore/plugin.js');
}

var imports = {
    dbcore: dbcoreModule.init(client, null).exports,
    'admin': {
        'isAdmin': function() {
            return Promise.resolve();
        }
    }
};

var plugin = require('../plugin').init(client, imports);

// init response
const dbResponsePromise = imports.dbcore.then(function(knex) {
    // response.js will return a promise as it fetches all responses
    return require('../lib/respond')(knex, client._logger.notice, client._logger.debug).then(function(respond) {
        return respond;
    });
});

// CLear and seed
var clearAndSeed = (require('./before-each')(dbResponsePromise));

beforeEach('Clearing and seeding database with 3 responses and 6 triggers.', clearAndSeed);

// test modules
respondTests(dbResponsePromise);

cacheTests(dbResponsePromise);

respondCacheIntegrationTests(dbResponsePromise);

pluginRespondIntegrationTests(dbResponsePromise, plugin);

variableFormatTests();
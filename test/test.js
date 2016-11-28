var Promise = require('bluebird');

var client = require('./mock-client');
var dbcoreModule = null;
var adminModule = null;

var respondTests = require("./respond");
var cacheTests = require("./cache");
var respondCacheIntegrationTests = require("./respond-cache-integration");
var pluginRespondIntegrationTests = require("./plugin-respond-integration");
var responseNoAdmin = require("./respond-no-admin");
var variableFormatTests = require('./variable-format');

if (process.env.NODE_ENV === 'development') {
    
    console.log('Using tennu-dbcore locally. (useful if youre not using the npm registry version)');
    dbcoreModule = require('../../tennu-dbcore/plugin.js');
    console.log('Using tennu-admin locally. (useful if youre not using the npm registry version)');
    adminModule = require("../../tennu-admin/plugin.js");
} else {
    dbcoreModule = require('tennu-dbcore');
    adminModule = require("tennu-admin");
}

var imports = {
    dbcore: dbcoreModule.init(client, null).exports,
    admin: adminModule.init(client, {
        user: {
            isIdentifiedAs: function(){
                
            }
        }
    }).exports
};

var plugin = require('../plugin').init(client, imports);

// init response
// response.js will return a promise as it fetches all responses
const dbResponsePromise = require('../lib/respond')(imports.dbcore.knex, client._logger.notice, client._logger.debug).then(function(respond) {
    return respond;
});

// CLear and seed
var clearAndSeed = (require('./before-each')(dbResponsePromise));

beforeEach('Clearing and seeding database with 3 responses and 6 triggers.', clearAndSeed);

// test modules
responseNoAdmin(dbResponsePromise, plugin, client, imports);

respondTests(dbResponsePromise);

cacheTests(dbResponsePromise);

respondCacheIntegrationTests(dbResponsePromise);

pluginRespondIntegrationTests(dbResponsePromise, plugin);

variableFormatTests();

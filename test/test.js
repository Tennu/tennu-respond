var assert = require('assert');
var Promise = require('bluebird');
var _ = require('lodash');
var client = require('./mock-client');
var dbcoreModule = require('tennu-dbcore');
// var errors = require('../lib/errors');

if (process.env.NODE_ENV === 'development') {
    dbcoreModule = require('../../tennu-dbcore/plugin.js');
}

var imports = {
    dbcore: dbcoreModule.init(client, null).exports
}

// init response
const dbResponsePromise = imports.dbcore.then(function(knex) {
    // response.js will return a promise as it fetches all responses
    return require('../lib/respond')(knex, client).then(function(respond) {
        return respond;
    });
});

var masterNickname = 'TheCreator';

// tests!
describe('Respond', function() {

    // CLear and seed
    var clearAndSeed = (require('./before-each')(dbResponsePromise));
    beforeEach(clearAndSeed);

    describe('add', function() {
        it('Should insert a response and triggers into the database', function(done) {
            dbResponsePromise.then(function(respond) {
                respond.add(['a', 'b'], 'c', 0.03, 'TestUser')
                    .then(function(newResponse) {
                        assert.equal(newResponse.related('triggers').length, 2);
                        assert.equal(newResponse.get('response'), 'c');
                        done();
                    });
            });
        });
        it('Empty chance should throw', function(done) {
            dbResponsePromise.then(function(respond) {
                respond.add(['a', 'b'], 'c', null, 'test_user')
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(_.any(e.errors.trigger.errors, {rule: 'required'}), true);
                        done();
                    });
            });
        });        
        it('Empty trigger should throw when missing trigger value', function(done) {
            dbResponsePromise.then(function(respond) {
                respond.add(['', 'b'], 'c', 0.03, 'test_user')
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(_.any(e.errors.trigger.errors, {rule: 'required'}), true);
                        done();
                    });
            });
        });
        it('Empty response should throw when missing response', function(done) {
            dbResponsePromise.then(function(respond) {
                respond.add(['a', 'b'], '', 0.03, 'test_user')
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(_.any(e.errors.response.errors, {rule: 'required'}), true);
                        done();
                    });
            });
        });
        it('Empty trigger should throw when created_by missing value', function(done) {
            dbResponsePromise.then(function(respond) {
                respond.add(['a', 'b'], 'c', 0.03, '')
                    .then(assert.fail)
                    .catch(function(e) {
                        assert.equal(_.any(e.errors.created_by.errors, {rule: 'required'}), true);
                        done();
                    });
            });
        });

    });

    describe('emit', function() {
        it('Should emit trigger when inserted at 100%');
    });

    describe('details', function() {
        it('Should return details for a response');
        it('Should return details for a trigger');
    });

    describe('details', function() {
        it('Should delete response when only trigger is deleted');
        it('Should delete all triggers when response is deleted');
    });

});
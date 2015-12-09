var assert = require('assert');
var Promise = require('bluebird');

// mock client and imports
var client = require('./mock-client');

var dbcoreModule = require('tennu-dbcore');
if (process.env.NODE_ENV === 'development') {
    dbcoreModule = require('../../tennu-dbcore/plugin.js');
}

var imports = {
    dbcore: dbcoreModule.init(client, null).exports
}

// init response
const dbResponsePromise = imports.dbcore.then(function(knex) {
    // response.js will return a promise as it fetches all responses
    return require('../respond')(knex, client).then(function(respond) {
        return respond;
    });
});

var masterNickname = 'TheCreator';

// tests!
describe('Respond', function() {

    // CLear and seed
    beforeEach(function() {
        dbResponsePromise.then(function(respond) {
            return knex('respond')
                .delete().then(function() {
                    return knex('trigger')
                        .delete();
                }).then(function() {
                    // Seed
                    var seeds = [{
                        Trigger: 'a',
                        RespondID: newResponseID[0],
                        Chance: chance,
                        CreatedBy: nickname,
                        CreatedOn: Date.now()
                    }];
                    
                    
                    
                });
        });
    });

    describe('add', function() {
        it('Should insert a trigger into the database', function(done) {
            dbResponsePromise.then(function(respond) {

                var newTriggers = ['a'];
                var response = 'b';
                var chance = 0.03;

                respond.add(newTriggers, response, chance, masterNickname).then(function(inserted) {

                    assert.equal(newTriggers.length, inserted.length);
                    assert.equal(inserted[0].Trigger, newTriggers[0]);
                    assert.equal(inserted[0].Chance, chance);
                    assert.equal(inserted[0].CreatedBy, masterNickname);



                    done();
                });



            });
        });

        it('Should insert 3 triggers into the database', function(done) {
            dbResponsePromise.then(function(respond) {

                var newTriggers = ['d', 'e', 'f'];
                var response = 'g';
                var chance = 1.00;

                respond.add(newTriggers, response, chance, masterNickname).then(function(inserted) {
                    assert.equal(newTriggers.length, inserted.length);

                    assert.equal(inserted[0].Trigger, newTriggers[0]);
                    assert.equal(inserted[1].Trigger, newTriggers[1]);
                    assert.equal(inserted[2].Trigger, newTriggers[2]);

                    assert.equal(inserted[0].Chance, chance);
                    assert.equal(inserted[0].CreatedBy, masterNickname);
                    done();
                });
            });
        });
    });

    describe('emit', function() {
        it('Should emit trigger when inserted at 100%', function(done) {
            dbResponsePromise.then(function(respond) {
                respond.emit('d').then(function(emittedResponse) {
                    assert.equal(emittedResponse[0].Response, 'g');
                    done();
                });
            });
        });

    });

    describe('details', function() {
        it('Should return details for a response', function(done) {
            dbResponsePromise.then(function(respond) {

                var newTriggers = ['h'];
                var response = 'i';
                var chance = 0.03;

                respond.add(newTriggers, response, chance, masterNickname).then(function(inserted) {
                    var ID = inserted[0].RespondID;
                    respond.details('respond', ID).then(function(details) {
                        assert.equal(details.length, 1);
                        assert.equal(details[0].Response, response);
                        assert.equal(details[0].CreatedBy, masterNickname);
                        done();
                    });
                });
            });

        });

        it('Should return details for a trigger', function(done) {
            dbResponsePromise.then(function(respond) {

                var newTriggers = ['j'];
                var response = 'k';
                var chance = 0.33;

                respond.add(newTriggers, response, chance, masterNickname).then(function(inserted) {
                    // Fetch inserted ID
                    return imports.dbcore.then(function(knex) {
                        return knex.select('ID')
                            .table('trigger')
                            .where('RespondID', inserted[0].RespondID)
                    }).then(function(triggerSelect) {
                        var ID = triggerSelect[0].ID;
                        respond.details('trigger', ID).then(function(details) {
                            assert.equal(details.length, 1);
                            assert.equal(details[0].Trigger, newTriggers[0]);
                            assert.equal(details[0].Chance, chance);
                            assert.equal(details[0].CreatedBy, masterNickname);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('details', function() {

        it('Should delete response when only trigger is deleted', function(done) {

            dbResponsePromise.then(function(respond) {

                var newTriggers = ['l'];
                var response = 'm';
                var chance = 0.83;

                respond.add(newTriggers, response, chance, masterNickname).then(function(inserted) {
                    // Fetch inserted ID
                    Promise.try(function() {
                        return imports.dbcore;
                    }).then(function(knex) {

                        return knex.select()
                            .table('trigger')
                            .where('RespondID', inserted[0].RespondID)
                            .then(function(inserted) {

                                assert.equal(inserted.length, 1);

                                var triggerID = inserted[0].ID;
                                var respondID = inserted[0].RespondID;

                                // Delete inserted
                                return respond.remove('trigger', triggerID).then(function(removedTriggers) {

                                    console.log(removedTriggers);

                                    // Removal go okay?
                                    assert.equal(removedTriggers.length, 1);
                                    assert.equal(removedTriggers[0].Trigger, newTriggers[0]);

                                }).then(function() {
                                    return knex.select()
                                        .table('respond')
                                        .where('ID', respondID)
                                }).then(function(response) {
                                    assert.equal(response, []);
                                    done();
                                });
                            });
                    });
                });
            });
        });

        it('Should delete all triggers when response is deleted');
    });

});
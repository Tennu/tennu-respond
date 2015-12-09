var format = require('util').format;
var Promise = require('bluebird');
var error = require('./errors');
var _ = require('lodash');

function emit(message) {
    var self = this;

    return Promise.try(function() {
        return Promise.filter(self.triggers, function(trigger) {
            return trigger.Trigger === message;
        }).then(function(found) {

            if (found.length === 0) {
                throw error.RespondNoTriggerError({
                    userMessage: message
                });
            }

            return Promise.filter(found, function(trigger) {
                var random = Math.random();
                self.client._logger.debug(format('Trigger chance was %s, random was %s.', trigger.Chance, random));
                return random < trigger.Chance;
            }).map(function(trigger) {
                return trigger.RespondID;
            }).then(function(IDs) {

                if (IDs.length === 0) {
                    return;
                }

                return self
                    .knex
                    .select()
                    .from('respond')
                    .whereIn('ID', IDs);
            });

        });

    });
}

function add(newTriggers, response, chance, nickname) {
    var self = this;

    if (_.some(newTriggers, _.isEmpty)) {
        throw error.RespondTriggerNullOrEmptyError();
    }

    if (_.some(response, _.isEmpty)) {
        throw error.RespondResponseNullOrEmptyError();
    }

    return self.knex('respond').insert({
        response: response,
        CreatedBy: nickname,
        CreatedOn: Date.now()
    }).then(function(newResponseID) {
        return Promise.map(newTriggers, function(trigger) {
            return {
                Trigger: trigger,
                RespondID: newResponseID[0],
                Chance: chance,
                CreatedBy: nickname,
                CreatedOn: Date.now()
            };
        });
    }).then(function(knexObjects) {
        return self.knex('trigger').insert(knexObjects).then(function() {
            self.triggers = self.triggers.concat(knexObjects);
            return knexObjects;
        });
    });
}

function remove(type, ID) {
    var self = this;
    if (type === 'respond') {
        return self.knex('trigger')
            .where('RespondID', ID)
            .delete()
            .then(function() {
                return self.knex('respond')
                    .where('ID', ID)
                    .delete();
            }).then(function() {
                return _.remove(self.triggers, {
                    'RespondID': ID
                });
            });
    }
    if (type === 'trigger') {
        return self.knex
            .select('RespondID')
            .table('trigger')
            .where('ID', ID)
            .then(function(respondIDs) {
                if (respondIDs.length === 1) {
                    // Delete respond
                    return self.knex('respond')
                        .where('ID', respondIDs[0].RespondID)
                        .delete();
                }
            })
            .then(function(deletedTriggers) {
                return self.knex('trigger')
                    .where('ID', ID)
                    .delete();
            })
            .then(function(deletedResponses) {
                var removed = _.remove(self.triggers, {
                    'ID': ID
                });
                console.log(ID);
                console.log(removed);
                console.log(self.triggers);
                return removed
            });
    }
}

function details(type, ID) {
    return this.knex
        .select()
        .table(type)
        .where('ID', ID);
}

function search(query, page, resultsPerPage) {
    var self = this;

    // return self.knex
    //     .select('*')
    //     .from('respond')
    //     .leftOuterJoin('trigger', 'respond.ID', 'trigger.RespondID')
    //     .unionAll(function() {
    //         self.knex
    //             .select('*')
    //             .from('trigger')
    //             .leftOuterJoin('trigger', 'respond.ID', 'trigger.RespondID')
    //     }).whereNull('ID')
    //     .limit(resultsPerPage)
    //     .offset(page);;


    // return this.knex('respond')
    //     .join('trigger', 'respond.ID', 'trigger.RespondID')
    //     .andWhere('Response', query)
    //     .orWhere('trigger', query)
    //     .limit(resultsPerPage)
    //     .offset(page);
}

function list(page, resultsPerPage) {

}

function respond(knexContext, client) {
    var bookshelf = require('bookshelf')(knexContext);

    var Respond = bookshelf.Model.extend({
        tableName: 'respond',
        triggers: function() {
            return this.hasMany(Trigger);
        }
    });

    var Trigger = bookshelf.Model.extend({
        tableName: 'trigger',
        respond: function() {
            return this.belongsTo(Respond);
        }
    })

    return Promise.try(function() {
        Respond.fetchAll().then(function(respond) {

            console.log(respond.related('triggers').toJSON());

        })
        return knexContext.select().table('trigger');
    }).then(function(dbTriggers) {
        client._logger.notice(format('tennu-response: loaded %s triggers(s)', dbTriggers.length));
        return {
            client: client,
            knex: knexContext,
            
            // Bookshelf stuff
            bookshelf: bookshelf,
            Respond: Respond,
            Trigger: Trigger,
            
            triggers: dbTriggers,
            emit: emit,
            add: add,
            details: details,
            remove: remove,
            // edit: edit,
            // list: list,
            search: search,
        };
    });
}

module.exports = respond;
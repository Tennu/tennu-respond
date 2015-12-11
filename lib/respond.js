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

function add(triggers, response, chance, nickname) {
    var self = this;

    // This doesnt work
    return new self.Response({
        'response': response,
        'created_by': nickname
    }).save(null, {
        require: true,
        method: 'insert'
    }).then(function(newResponse) {
        var triggersArray = [].concat(triggers);
        return Promise.each(triggersArray, function(trigger) {
            return newResponse.related('triggers').create({
                trigger: triggers[0],
                chance: chance,
                created_by: nickname
            });
        }).then(function() {
            return newResponse;
        });
    })
    // .catch(function(err){
    //     console.log('caught an error in the add API');
    // });
}

function remove(type, ID) {
    var self = this;

    // type===trigger Dont let orphaned responses exist
    // type===response Dont let orphaned triggers exist

}

function details(type, ID) {

}

function search(query, page, resultsPerPage) {
    var self = this;


}

function list(page, resultsPerPage) {

}

function respond(knexContext, client) {
    var bookshelf = require('bookshelf')(knexContext);
    var models = require('./models')(bookshelf);

    return new models.Response().fetchAll({
        withRelated: 'triggers'
    }).then(function(dbTriggers) {
        client._logger.notice(format('tennu-response: loaded %s triggers(s)', dbTriggers.length));
        return {
            // "private" api
            client: client,
            knex: knexContext,

            // Bookshelf stuff
            bookshelf: bookshelf,
            Response: models.Response,
            Trigger: models.Trigger,
            Responses: models.Responses,
            Triggers: models.Triggers,

            // Trigger cache
            triggers: dbTriggers,

            // API
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
var format = require('util').format;
var Promise = require('bluebird');
var error = require('./errors');
var _ = require('lodash');

/**
 * gathers all triggers that appear in the provided message and then hunts down their parent responses.
 * Merges duplicates.
 * @param {Array or String} triggers
 * @param {String} message
 * @return {Object} response and triggers
 */
function tryEmit(message) {
    if (!_.isString(message)) {
        throw error.ParameterNotStringError({
            param: 'message'
        });
    }
    var self = this;
    return Promise.try(function() {
        return Promise.filter(self.cache.triggerCache, function(trigger) {
                return (message.indexOf(trigger.get('trigger')) > -1);
            }).then(function(found) {
                if (found.length === 0) {
                    throw error.RespondNoTriggerError({
                        userMessage: message
                    });
                }
                return found;
            }).filter(function(trigger) {
                var random = Math.random();
                if (this.debugLogger) {
                    this.debugLogger(format('Trigger chance was %s, random was %s.', trigger.get('chance'), random));
                }
                return (random < trigger.get('chance'));
            })
            .map(function(trigger) {
                return new self.Response({
                        id: trigger.get('response_id')
                    })
                    .fetch({
                        require: true
                    });
            })
            .map(function(response) {
                return response.toJSON();
            }).then(function(responses) {
                return _.uniq(responses);
            });
    });
}

/**
 * Adds a response and triggers to the database
 * @param {Array or String} triggers
 * @param {String} response
 * @param {Number} chance
 * @param {String} nickname
 * @return {Object} response and triggers
 */
function add(triggers, response, chance, nickname) {
    var self = this;
    return Promise.try(function() {
        return _isNonEmptyArray(triggers).then(function() {
            return self.bookshelf.transaction(function(t) {
                return new self.Response({
                        'response': response,
                        'created_by': nickname
                    }).save(null, {
                        require: true,
                        method: 'insert',
                        transacting: t
                    }).then(_addResponseTriggers(triggers, chance, nickname, t))
                    .then(function(newResponse) {
                        return newResponse.toJSON();
                    });
            });
        });
    });
}

/**
 * Adds a triggers to existing response
 * @param {Array or String} triggers
 * @param {Number} responseId
 * @param {Number} chance
 * @param {String} nickname
 * @return {Object} response and triggers
 */
function addTriggers(responseId, triggers, chance, nickname) {
    var self = this;
    return Promise.try(function() {
        return _isNonEmptyArray(triggers).then(function() {
            return self.bookshelf.transaction(function(t) {
                return new self.Response({
                        id: responseId
                    })
                    .fetch({
                        require: true,
                        withRelated: 'triggers',
                        transacting: t
                    })
                    .then(_addResponseTriggers(triggers, chance, nickname, t))
                    .then(function(response) {
                        return response.toJSON();
                    });
            });
        });
    });
}

/**
 * Removes response or trigger from the database
 * @param {String} responseType
 * @param {Number} id
 * @return {Object} response or triggers
 */
function remove(responseType, id) {
    var self = this;
    return Promise.try(_validateType(responseType))
        .then(function() {
            if (responseType === 'response') {
                return _removeResponse.apply(self, [id]);
            }
            else if (responseType === 'trigger') {
                return _removeTrigger.apply(self, [id]);
            }
        });
}

/**
 * Edits a response or a trigger in the database.
 * Chance for trigger is optional.
 * @param {String} responseType
 * @param {Number} id
 * @param {String} text
 * @param {Number} chance
 * @return {Object} response or trigger
 */
function edit(responseType, id, text, chance) {
    var self = this;
    return Promise.try(_validateType(responseType))
        .then(function() {
            if (responseType === 'response') {
                return new self.Response({
                        id: id
                    })
                    .save({
                        response: text
                    }, {
                        method: 'update',
                        patch: true,
                        require: true
                    });
            }
            else if (responseType === 'trigger') {

                return Promise.try(function() {
                    if (_.isUndefined(chance) || _.isNull(chance)) {
                        return new self.Trigger({
                            id: id
                        }).fetch({
                            require: true,
                            columns: 'chance'
                        })
                    }
                }).then(function(existingChance) {
                    if (!_.isUndefined(existingChance)) {
                        chance = existingChance.get('chance');
                    }
                    return new self.Trigger({
                            id: id
                        })
                        .save({
                            trigger: text,
                            chance: chance
                        }, {
                            method: 'update',
                            patch: true,
                            require: true
                        });
                });
            }

        }).then(function(updatedModel) {
            return updatedModel.toJSON();
        });
}

/**
 * Returns all responses and their triggers from the datase
 * @return {Array} response and their triggers
 */
function getAll() {
    return new this.Response().fetchAll({
        withRelated: 'triggers'
    }).then(function(data) {
        return data.toJSON();
    })
}

/**
 * Private
 * Add triggers to an existing response
 * @param {Array} triggers
 * @param {Number} Chance
 * @param {String} Nickname
 * @param {Object} activate transaction instance
 * @return {Function} A function which takes a response typically provided by the 'then' function
 */
function _addResponseTriggers(triggers, chance, nickname, transaction) {
    var options = {
        require: true,
        method: 'insert'
    };
    if (transaction) {
        options.transacting = transaction;
    }
    return function(response) {
        var triggersArray = [].concat(triggers);
        return Promise.each(triggersArray, function(trigger) {
            return response.related('triggers').create({
                trigger: trigger,
                chance: chance,
                created_by: nickname
            }, options);
        }).then(function() {
            return response;
        });
    }
}

/**
 * Private
 * Deletes a response and related triggers
 * @param {Number} id
 * @return {Promise eventually an Object} the deleted response and its triggers
 */
function _removeResponse(id) {
    var self = this;
    return self.bookshelf.transaction(function(t) {
        return Promise.try(function() {
            return new self.Response({
                id: id
            }).fetch({
                require: true,
                withRelated: 'triggers',
                transacting: t
            });
        }).then(function(responseToDelete) {
            var deletedResponseData = responseToDelete.toJSON();
            return Promise.try(function() {
                return responseToDelete.related('triggers').invokeThen('destroy', {
                    transacting: t
                });
            }).then(function() {
                return responseToDelete.destroy({
                    transacting: t
                });
            }).then(function() {
                return deletedResponseData;
            });
        });
    });
}

/**
 * Private
 * Deletes a trigger and related response if its the responses sole trigger
 * @param {Number} id
 * @return {Promise eventually an Object} the deleted trigger and possibly its parent reponse
 */
function _removeTrigger(id) {
    var self = this;
    return self.bookshelf.transaction(function(t) {
        return Promise.try(function() {
            return new self.Trigger({
                id: id
            }).fetch({
                require: true,
                withReleated: 'response',
                transacting: t
            });
        }).then(function(trigger) {
            // Try to retrieve the parent, and subsequently the chain
            return Promise.try(function() {
                return new self.Response({
                        id: trigger.get('response_id')
                    })
                    .fetch({
                        withRelated: 'triggers',
                        transacting: t,
                        require: true
                    });
            }).then(function(response) {

                var returnObject = {
                    trigger: trigger.toJSON()
                };

                var responseJSON = response.toJSON();

                return Promise.try(function() {
                    if (response.related('triggers').length === 1) {
                        returnObject.response = responseJSON;
                        return response.destroy({
                            require: true,
                            transacting: t
                        });
                    }
                }).then(function() {
                    return trigger.destroy({
                        require: true,
                        transacting: t
                    });
                }).then(function() {
                    return returnObject;
                });
            });
        });
    });
}

/**
 * Private
 * Provides a function that will throw an error if an invalid responseTypeis provided.
 * Only 'response' and 'trigger' are valid types.
 * @param {Number} id
 * @return {Function}
 */
function _validateType(responseType) {
    return function() {
        if (responseType !== 'response' && responseType !== 'trigger') {
            throw error.RespondTypeInvalidError({
                responseType: responseType
            })
        }
    }
}

/**
 * Private
 * Throws if param is anything other than an array with at least one item in it.
 * Only 'response' and 'trigger' are valid types.
 * @param {Array} array (hopefully)
 * @return {Promise}
 */
function _isNonEmptyArray(array) {
    return Promise.try(function() {
        if (Array.isArray(array) && array.length === 0) {
            throw error.RespondTriggerArrayEmptyError();
        }
    });
}

/**
 * Returns an instance of the respond API ready to serve requests
 * @param {Object} Knex instance
 * @param {Function} Optional, Logger instance, notice function
 * @param {Function} Optional, Logger instance, debug function
 * @return {Object} API
 */
function respond(knexContext, noticeLogger, debugLogger) {
    var bookshelf = require('bookshelf')(knexContext);
    var models = require('./models')(bookshelf);

    return new models.Response().fetchAll({
            withRelated: 'triggers'
        })
        .then(function(responseCollection) {
            return Promise.map(responseCollection.models, function(response) {
                return response.related('triggers');
            });
        })
        .then(function(triggerCollections) {
            if (triggerCollections.length !== 0) {
                return Promise.each(triggerCollections, function(trigger) {
                    return Promise.each(trigger.models, function(triggerModel) {
                        models.cache.triggerCache.push(triggerModel);
                    });
                });
            }
        })
        .then(function() {
            if (noticeLogger) {
                noticeLogger(format('tennu-response: loaded %s triggers(s)', models.cache.triggerCache.length));
            }
            return {
                // "private" api
                debugLogger: debugLogger,
                noticeLogger: noticeLogger,
                knex: knexContext,

                // Bookshelf stuff
                bookshelf: bookshelf,
                Response: models.Response,
                Trigger: models.Trigger,
                Responses: models.Responses,
                Triggers: models.Triggers,

                // Trigger cache
                cache: models.cache,

                // API
                tryEmit: tryEmit,
                add: add,
                addTriggers: addTriggers,
                remove: remove,
                edit: edit,
                getAll: getAll,
            };
        });
}

module.exports = respond;
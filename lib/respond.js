var format = require('util').format;
var Promise = require('bluebird');
var error = require('./respond-errors');
var _ = require('lodash');
var validators = require('./validators');

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
            })
            .then(function(found) {
                if (found.length === 0) {
                    throw error.RespondNoTriggerError({
                        userMessage: message
                    });
                }
                return found;
            })
            .filter(function(trigger) {
                var random = Math.random();
                if (this.debugLogger) {
                    this.debugLogger(format('Trigger chance was %s, random was %s.', trigger.get('chance'), random));
                }
                return (random < trigger.get('chance'));
            })
            .then(function(triggersThatPassed) {
                if (triggersThatPassed.length === 0) {
                    throw error.NoTriggerPassedChanceCheckError();
                }
                else {
                    return triggersThatPassed;
                }
            })
            .map(function(trigger) {
                return trigger.refresh({
                    withRelated: 'response',
                    require: true
                });
            })
            .map(function(triggerWithResponse) {
                return triggerWithResponse.related('response').toJSON();
            })
            .then(function(responses) {
                return _.uniq(responses, 'response');
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
function add(triggers, response, chance, nickname, executable) {
    var self = this;
    return Promise.try(function() {
        return _isNonEmptyArray(triggers).then(function() {
            return self.bookshelf.transaction(function(t) {
                return new self.Response({
                        'response': response,
                        'executable': !!executable,
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
 * Edits a response or a trigger in the database.
 * Chance for trigger is optional.
 * @param {String} responseType
 * @param {Number} id
 * @param {String} text
 * @param {Number} chance
 * @return {Object} response or trigger
 */
function edit(responseType, id, text, chance, executable) {
    var self = this;
    return Promise.try(validators.validateType(responseType))
        .then(function() {
            if (responseType === 'response') {
                return new self.Response({
                        id: id
                    })
                    .save({
                        response: text,
                        executable: !!executable
                    }, {
                        method: 'update',
                        patch: true,
                        require: true
                    });
            }
            else if (responseType === 'trigger') {
                return Promise.try(function() {
                    if (_.isUndefined(chance)) {
                        return new self.Trigger({
                            id: id
                        }).fetch({
                            require: true,
                            columns: 'chance'
                        });
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
    return new this.Response().fetchAll()
    .then(function (responses) {
        return responses.mapThen(function (response) {
            return response.load(['triggers']);
        });
    })
    .then(function (responses) {
        return responses.reduce(function (previous, current) {
            previous.push(current.toJSON());
            return previous;
        }, []);
    })
    .then(function(data) {
        return data;
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
 * Deletes a response and related triggers
 * @param {Number} id
 * @return {Promise eventually an Object} the deleted response and its triggers
 */
function removeResponse(id) {
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
 * Deletes a trigger and related response if its the responses sole trigger
 * @param {Number} id
 * @return {Promise eventually an Object} the deleted trigger and possibly its parent reponse
 */
function removeTrigger(id) {
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
                    return trigger.destroy({
                        require: true,
                        transacting: t
                    });
                }).then(function() {
                    if (response.related('triggers').length === 1) {
                        returnObject.response = responseJSON;
                        return response.destroy({
                            require: true,
                            transacting: t
                        });
                    }
                }).then(function() {
                    return returnObject;
                });
            });
        });
    });
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
    var models = require('./bookshelf/models')(bookshelf);

    return new models.Response().fetchAll()
        .then(function (responses) {
            return responses.mapThen(function (response) {
                return response.load(['triggers']);
            });
        })
        .then(function(responseCollection) {
            return Promise.map(responseCollection, function(response) {
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
                removeTrigger: removeTrigger,
                removeResponse: removeResponse,
                edit: edit,
                getAll: getAll,
            };
        });
}

module.exports = respond;
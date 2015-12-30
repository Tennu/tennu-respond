var parseArgs = require("minimist");
// var moment = require('moment');
var format = require('util').format;
var Promise = require('bluebird');
// var clamp = require('clamp');
var _ = require('lodash');
var haste = require('./lib/haste');
var modelFormat = require('./lib/model-format');
var validators = require('./lib/validators');

// Will not change if 2 instances of tennu launched
// Move this to JSON
const helps = require('./help');

const _requiresAdminHelp = 'This command requires administrator proviledges.';

const _getNotice = function(message) {
    return {
        'intent': 'notice',
        'query': true,
        'message': message
    };
};

const _adminFail = function(err) {
    return {
        intent: 'notice',
        query: true,
        message: err
    };
}

const responseEditArgs = {
    alias: {
        'c': 'chance'
    }
};

var TennuSay = {
    requiresRoles: ["admin", "dbcore"],
    init: function(client, imports) {

        var isAdmin = imports.admin.isAdmin;

        const dbResponsePromise = imports.dbcore.then(function(knex) {
            // response.js will return a promise as it fetches all responses
            return require('./lib/respond')(knex, client._logger.notice, client._logger.debug).then(function(respond) {
                return respond;
            });
        });

        var respondConfig = client.config("respond");

        if (!respondConfig || !respondConfig.hasOwnProperty("defaultChance")) {
            throw Error("respond is missing some or all of its configuration.");
        }

        /**
         * Handles parsing subcommands out of !respond.
         **/
        function respondRouter() {
            return function(IRCMessage) {
                return isAdmin(IRCMessage.hostmask).then(function(isadmin) {
                    // isadmin will be "undefined" if cooldown system is enabled
                    // isadmin will be true/false if cooldown system is disabled
                    if (typeof(isadmin) !== "undefined" && isadmin === false) {
                        throw new Error(_requiresAdminHelp);
                    }
                }).then(function() {
                    switch (IRCMessage.args[0]) {
                        case 'list':
                            return list(IRCMessage);
                        case 'remove':
                            return remove(IRCMessage);
                        case 'edit':
                            return edit(IRCMessage);
                        case 'add':
                            return add(IRCMessage);                            
                        default:
                            return _getNotice('Subcommand for respond not found. See !help respond and check your PMs.')
                    }
                }).catch(_adminFail);
            };
        }

        function emitResponse() {
            return function(IRCMessage) {
                return dbResponsePromise.then(function(respond) {
                    return respond.tryEmit(IRCMessage.message).then(function(responses) {
                        return _.pluck(responses, 'response');
                    }).catch(function(err) {
                        if (err.type !== 'respond.notrigger') {
                            client._logger.error(err);
                        }
                    });
                });
            };
        }

        function list(IRCMessage) {
            return dbResponsePromise.then(function(respond) {
                return respond.getAll().then(function(allResponsesAndTriggers) {

                    if (allResponsesAndTriggers.length === 0) {
                        return _getNotice('There are no responses yet. Use "!help respond" to add some.');
                    }

                    return Promise.try(function() {
                            return haste.postText(modelFormat.formatAll(allResponsesAndTriggers));
                        })
                        .catch(function(err) {
                            client._logger.error('Tennu-respond: An error has occured when attempting to haste.');
                            client._logger.error(err);
                            return _getNotice(err)
                        })
                        .then(function(hasteKey) {
                            console.log(hasteKey);
                            return _getNotice('https://hastebin.com/' + hasteKey);
                        });
                });
            });
        }

        function remove(IRCMessage) {

            var respondType = IRCMessage.args[1];
            var ID = IRCMessage.args[2];

            return Promise.try(validators.validateType(respondType))
                .then(function() {
                    return dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                                var methodName = 'remove' + _.capitalize(respondType);
                                return respond[methodName](ID);
                            })
                            .then(function(removedItems) {
                                if (_.has(removedItems, 'trigger') && _.has(removedItems, 'response')) {
                                    var formatResponse = modelFormat.formatResponse(removedItems.response);
                                    var formattedTrigger = modelFormat.formatTrigger(removedItems.trigger);
                                    return formatResponse + formattedTrigger;
                                }
                                else if (_.has(removedItems, 'trigger')) {
                                    return modelFormat.formatTrigger(removedItems.trigger);
                                }
                                else {
                                    return modelFormat.formatAll([removedItems]);
                                }
                            })
                            .then(function(formatted) {
                                return modelFormat.formatTennuResponseFriendly(formatted, 'DELETED');
                            }).then(function(messages) {
                                return _getNotice(messages);
                            })
                            .catch(function(err) {
                                //console.log(err);
                                // Thrown by bookshelf 'require: true'
                                if (err.message === 'EmptyResponse') {
                                    return _getNotice(format('%s is not a valid %s ID.', ID, respondType));
                                }
                            });
                    });
                }).catch(function() {
                    return _getNotice('Type must be "response" or "trigger"');
                });
        }

        function edit(IRCMessage) {

            var sargs = parseArgs(IRCMessage.args, responseEditArgs);

            var respondType = sargs._[1];
            var ID = sargs._[2];
            var chance = sargs.chance;
            var text = sargs._.slice(3, sargs._.length).join(' ');

            return Promise.try(validators.validateType(respondType))
                .then(function() {
                    return dbResponsePromise.then(function(respond) {
                        return respond.edit(respondType, ID, text, chance);
                    }).then(function(modified) {
                        var methodName = 'formatUpdated' + _.capitalize(respondType);
                        return modelFormat[methodName](modified);
                    }).then(function(formatted) {
                        return modelFormat.formatTennuResponseFriendly(formatted, 'UPDATED');
                    }).then(function(messages) {
                        return _getNotice(messages);
                    });
                }).catch(function(err) {

                    if (err.type === 'respond.typeinvalid') {
                        return _getNotice('Type must be "response" or "trigger"');
                    }

                    if (err.message === 'No Rows Updated' || err.message === 'EmptyResponse') {
                        return _getNotice(format('%s is not a valid %s ID.', ID, respondType));
                    }

                    if (_.get(err, ['errors', respondType, 'message'], null) === format('The %s is required', respondType)) {
                        return _getNotice(format('You must provide new text for the %s', respondType));
                    }

                    if (_.get(err, ['errors', 'chance', 'message'], false)) {
                        return _getNotice(_.get(err, ['errors', 'chance', 'message']));
                    }

                });
        }

        function add(IRCMessage){
            
            // !respond t/t/t/t/r
            
            var sargs = parseArgs(IRCMessage.args, responseEditArgs);
            
            var chance = _.get(sargs, 'chance', respondConfig.defaultChance);
            
            var choppedText = sargs._.slice(1, sargs._.length).split('/');
            
            
        }

        return {
            handlers: {
                "privmsg": emitResponse(),
                "!respond": respondRouter(),
            },
            commands: ["respond"],
            help: {
                "respond": {
                    "*": helps.global,
                    "add": helps.add
                }
            }
        };
    }
};

module.exports = TennuSay;
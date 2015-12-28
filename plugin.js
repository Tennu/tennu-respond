// var parseArgs = require("minimist");
// var moment = require('moment');
var format = require('util').format;
var Promise = require('bluebird');
// var clamp = require('clamp');
var _ = require('lodash');
var haste = require('./lib/haste');
var modelFormat = require('./lib/model-format');

// Will not change if 2 instances of tennu launched
// Move this to JSON
const helps = {
    "global": [
        "Maintains trigger words that will fire pre-determined responses. Can be set to only respond occasionally.",
        "!respond add [-c=.3] <ID> <new_text>",
        "!respond edit <type> <ID> <new_text>",
        "!respond remove <type> <ID>",
        "!respond list",
    ],
    "add": [
        "{{!}}respond [-c=chance] <target>[/<target2>/<target3>]/<response>",
        "Sets a trigger word(s) with a chance of responding with a phrase.",
        "Modifiers: ",
        "-c=chance : must be between 0.000 and 1.000"
    ],
    // How to handle editing chance?
    "edit": [
        "{{!}}respond edit <type> <ID> <new_text>",
        "Modifys the text and chance for the response or trigger.",
        "Modifiers: ",
        "-c=chance : must be between 0.000 and 1.000"
    ],
    "remove": [
        "{{!}}respond remove <type> <ID>",
        "Removes either a trigger or a respond.",
        "CAUTION:",
        "Removing a respond removes ALL triggers. Likewise, removing the only trigger for a respond, removes the respond.",
    ],
    "list": [
        "{{!}}returns a haste url containing all responses and triggers in DB",
    ],
};

const _requiresAdminHelp = 'This command requires administrator proviledges.';

const _getNotice = function(message) {
    return {
        'intent': 'notice',
        'query': 'true',
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

// const respondAddArgs = {
//     alias: {
//         'c': 'chance'
//     }
// };

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
                        .then(function(hasteKey) {
                            return _getNotice('https://hastebin.com/' + hasteKey);
                        })
                        .catch(function(err) {
                            client._logger.error('Tennu-respond: An error has occured when attempting to haste.');
                            client._logger.error(err);
                            return _getNotice(err)
                        });
                });
            });
        }

        function remove(IRCMessage) {
            return dbResponsePromise.then(function(respond) {
                var respondType = IRCMessage.args[1];
                var ID = IRCMessage.args[2];
                return Promise.try(function() {
                        return respond.remove(respondType, ID);
                    })
                    .then(function(removedItems){
                        // Formatting....
                        console.log(removedItems);
                    })
                    .catch(function(err) {
                        if (err.type === 'respond.typeinvalid') {
                            return _getNotice('Type must be "response" or "trigger"');
                        }
                        // Thrown by bookshelf 'require: true'
                        if (err.message === 'EmptyResponse') {
                            return _getNotice(format('%s is not a valid %s ID.', ID, respondType));
                        }
                    });
            });
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
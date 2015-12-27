var parseArgs = require("minimist");
var moment = require('moment');
var format = require('util').format;
var Promise = require('bluebird');
var clamp = require('clamp');
var _ = require('lodash');
var haste = require('./lib/haste');

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

const requiresAdminHelp = 'This command requires administrator proviledges.';

const respondAddArgs = {
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

        var aSayConfig = client.config("respond");

        if (!aSayConfig || !aSayConfig.hasOwnProperty("defaultChance")) {
            throw Error("respond is missing some or all of its configuration.");
        }

        function respond() {
            return function(IRCMessage) {
                return isAdmin(IRCMessage.hostmask).then(function(isadmin) {
                    // isadmin will be "undefined" if cooldown system is enabled
                    // isadmin will be true/false if cooldown system is disabled
                    if (typeof(isadmin) !== "undefined" && isadmin === false) {
                        throw new Error(requiresAdminHelp);
                    }
                }).then(function() {
                    switch (IRCMessage.args[0]) {
                        case 'add':
                            return add(IRCMessage);
                        case 'search':
                            return search(IRCMessage);
                        case 'details':
                            return details(IRCMessage);
                        case 'remove':
                            return remove(IRCMessage);
                        default:
                            return {
                                intent: 'notice',
                                query: true,
                                message: ['Subcommand for respond not found. See !help respond and check your PMs.']
                            };
                    }
                }).catch(adminFail);
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

        function edit(IRCMessage) {
            var type = IRCMessage.args[1];
            if (['response', 'trigger'].indexOf(type) === -1) {
                return {
                    intent: 'notice',
                    query: true,
                    message: ['Subcommand for respond delete not found. See !help respond delete and check your PMs/notices.']
                };
            }

            // validate ID
            var ID = parseInt(IRCMessage.args[2], 10);
            if (isNaN(ID)) {
                return {
                    intent: 'notice',
                    query: true,
                    message: 'ID is not a number.'
                };
            }

            return dbResponsePromise.then(function(respond) {
                return respond.remove(type, ID);
            }).then(function(triggersRemoved) {
                console.log(triggersRemoved);
                if (triggersRemoved.length === 0) {
                    return {
                        intent: 'notice',
                        query: true,
                        message: format('Couldnt find anything to delete for "%s" ID=%s', type, ID)
                    };
                }
                return {
                    intent: 'notice',
                    query: true,
                    message: format('%s Deleted. Resulted in these triggers from being removed: %s', type, _.pluck(triggersRemoved, 'Trigger').join(', '))
                };
            });
        }

        function add(IRCMessage) {
            var sayArgs = parseArgs(IRCMessage.args, respondAddArgs);

            var slashes = IRCMessage.message.match(/\//g);

            if (!slashes || slashes.length < 1) {
                return {
                    intent: 'notice',
                    query: true,
                    message: ['respond takes a target(s) and a response.']
                };
            }

            var chance = aSayConfig.defaultChance;
            if (typeof(sayArgs.chance) !== 'undefined') {
                chance = clamp(sayArgs.chance, 0.0, 1.0);
            }

            // Build the targets and responses
            var items = _.takeRight(sayArgs._, sayArgs._.length - 1).join(' ').split('/');
            var targets = _.take(items, items.length - 1);
            var response = _.last(items);

            return dbResponsePromise.then(function(respond) {
                return respond.add(targets, response, chance, IRCMessage.nickname);
            }).then(function() {
                return {
                    intent: 'notice',
                    query: true,
                    message: [
                        format('When I hear: ', targets.join(', ')),
                        format('Response added. I will reply with "%s" %s% of the time.', response, (chance * 100))
                    ]
                };
            }).catch(function(err) {
                return {
                    intent: 'notice',
                    query: true,
                    message: err
                };
            });
        }

        function remove(IRCMessage){
            
        }
        
        function list(IRCMessage){
            // haste
        }        

        function adminFail(err) {
            return {
                intent: 'notice',
                query: true,
                message: err
            };
        }

        return {
            handlers: {
                "privmsg": emitResponse(),
                "!respond": respond(),
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
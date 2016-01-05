var parseArgs = require("minimist");
var format = require('util').format;
var Promise = require('bluebird');
var clamp = require('clamp');
var _ = require('lodash');
var haste = require('./lib/haste');
var modelFormat = require('./lib/model-format');
var validators = require('./lib/validators');

// Will not change if 2 instances of tennu launched
const helps = require('./help');

const _getNotice = function(message) {
    return {
        'intent': 'notice',
        'query': true,
        'message': message
    };
};

const responseEditArgs = {
    alias: {
        'c': 'chance'
    }
};

var TennuRespond = {
    requiresRoles: ["dbcore"],
    init: function(client, imports) {

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
                switch (IRCMessage.args[0]) {
                    case 'list':
                        return list(IRCMessage);
                    case 'remove':
                        return remove(IRCMessage);
                    case 'edit':
                        return edit(IRCMessage);
                    case 'add':
                        return add(IRCMessage);
                    case 'addtriggers':
                        return addtriggers(IRCMessage);
                    default:
                        return _getNotice('Subcommand for respond not found. See !help respond and check your PMs.')
                }
            };
        }

        function emitResponse() {
            return function(IRCMessage) {
                return dbResponsePromise.then(function(respond) {
                        return respond.tryEmit(IRCMessage.message)
                    })
                    .then(function(responses) {
                        return _.pluck(responses, 'response');
                    })
                    .catch(function(err) {
                        if (err.type !== 'respond.notriggerpassedchancecheck' && err.type !== 'respond.notrigger') {
                            client._logger.error(err);
                        }
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
                            var header = [
                                _.repeat('-', 90),
                                format('generated %s by %s', new Date(), IRCMessage.nickname),
                                format('Found %s responses.', allResponsesAndTriggers.length),
                                '',
                                'Report Fromat:',
                                '> Response data',
                                '\t> Response related trigger data',
                                '',
                                _.repeat('-', 90),
                                ' ',
                            ].join('\n');
                            var formated = modelFormat.formatAll(allResponsesAndTriggers);
                            return haste.postText(header + formated);
                        })
                        .catch(function(err) {
                            client._logger.error('Tennu-respond: An error has occured when attempting to haste.');
                            client._logger.error(err);
                            return _getNotice(err)
                        })
                        .then(function(hasteKey) {
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
                            })
                            .then(function(messages) {
                                return _getNotice(messages);
                            })
                            .catch(function(err) {
                                if (err.message === 'EmptyResponse') {
                                    return _getNotice(format('%s is not a valid %s ID.', ID, respondType));
                                }
                            });
                    });
                })
                .catch(function() {
                    return _getNotice('Type must be "response" or "trigger"');
                });
        }

        function edit(IRCMessage) {

            var sargs = parseArgs(IRCMessage.args, responseEditArgs);

            var respondType = sargs._[1];
            var ID = sargs._[2];
            var text = sargs._.slice(3, sargs._.length).join(' ');
            
            var chance = _.get(sargs, 'chance', respondConfig.defaultChance);
            if(!_.isUndefined(chance)){
                chance = clamp.prototype.saturate(chance);
            }

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
                })
                .catch(function(err) {

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

        function add(IRCMessage) {

            var sargs = parseArgs(IRCMessage.args, responseEditArgs);

            var chance = clamp.prototype.saturate(_.get(sargs, 'chance', respondConfig.defaultChance));
            var stringStart = (IRCMessage.message.indexOf('add') + 4);
            var resTrigData = IRCMessage.message.slice(stringStart, IRCMessage.message.length)
            var trimmedAndFilteredStr = resTrigData.replace(/([-]+c=*\d*\.*\d*){1}/i, '').trim();
            var choppedText = trimmedAndFilteredStr.split('/');

            var cleanedTriggers = _(choppedText).map(_.trim).value();

            if (_.some(cleanedTriggers, _.isEmpty)) {
                return _getNotice('Trigger or response missing.');
            }

            if (choppedText.length < 2) {
                return _getNotice('At least one trigger is required. See "!help respond add"');
            }

            if (_.some(choppedText, _.isEmpty)) {
                return _getNotice('Trigger or response missing.');
            }

            return dbResponsePromise.then(function(respond) {
                    return respond.add(_.dropRight(cleanedTriggers), _.last(cleanedTriggers), chance, IRCMessage.nickname);
                })
                .then(function(added) {
                    return modelFormat.formatAll([added]);
                })
                .then(function(formatted) {
                    return modelFormat.formatTennuResponseFriendly(formatted, 'ADDED');
                })
                .then(function(messages) {
                    return _getNotice(messages);
                })
                .catch(function(err) {
                    if (_.get(err, ['errors', 'chance', 'message'], false)) {
                        return _getNotice(_.get(err, ['errors', 'chance', 'message']));
                    }
                    if (err.message === 'EmptyResponse') {
                        return _getNotice('Invalid response ID.');
                    }
                });

        }

        function addtriggers(IRCMessage) {

            return Promise.try(function() {
                    var match = IRCMessage.message.match(/(addtriggers (\d+) )/);
                    if (match === null) {
                        throw Error('Response ID missing.');
                    }
                    else {
                        return match[2];
                    }
                })
                .then(function(responseID) {

                    var sargs = parseArgs(IRCMessage.args, responseEditArgs);

                    var chance = clamp.prototype.saturate(_.get(sargs, 'chance', respondConfig.defaultChance));

                    var stringStart = (IRCMessage.message.indexOf(responseID) + responseID.length);
                    var resTrigData = IRCMessage.message.slice(stringStart, IRCMessage.message.length)
                    var trimmedAndFilteredStr = resTrigData.replace(/([-]+c=*\d*\.*\d*){1}/i, '').trim();
                    var choppedText = trimmedAndFilteredStr.split('/')

                    var cleanedTriggers = _(choppedText).map(_.trim).value();

                    if (_.some(cleanedTriggers, _.isEmpty)) {
                        return _getNotice('Trigger or response missing.');
                    }

                    return dbResponsePromise.then(function(respond) {
                            return respond.addTriggers(responseID, choppedText, chance, IRCMessage.nickname);
                        })
                        .then(function(added) {
                            return modelFormat.formatAll([added]);
                        })
                        .then(function(formatted) {
                            return modelFormat.formatTennuResponseFriendly(formatted, 'ADDED TRIGGERS');
                        })
                        .then(function(messages) {
                            return _getNotice(messages);
                        })
                        .catch(function(err) {
                            if (err.message === 'EmptyResponse') {
                                return _getNotice('Invalid response ID.');
                            }
                        });
                })
                .catch(function(err) {
                    return _getNotice(err.message);
                })
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
                    "add": helps.add,
                    "list": helps.list,
                    "edit": helps.edit,
                    "remove": helps.remove,
                    "addtriggers": helps.addtriggers,
                }
            }
        };
    }
};

module.exports = TennuRespond;
const parseArgs = require("minimist");
const format = require('util').format;
const path = require('path');
const Promise = require('bluebird');
const clamp = require('clamp');
const _ = require('lodash');
const splitSlash = require('split-fwd-slash');
const exec = require('child-process-promise').exec;

const responseModifierFormat = require('./lib/response-modifier-format');
const modelFormat = require('./lib/model-format');
const validators = require('./lib/validators');

// Will not change if 2 instances of tennu launched
const helps = require('./help');

const _getNotice = function(message) {
    return {
        'intent': 'notice',
        'query': true,
        'message': message
    };
};

const responseAddEditArgs = {
    alias: {
        'c': 'chance',
        'e': ['executable', 'execute', 'exec']
    },
    boolean: 'e'
};

var TennuRespond = {
    configDefaults: {
        "respond": {
            "default-chance": 0.3,
            "no-admin": false,
            "denied-response": {
                "intent": "notice",
                "query": true,
                "message": "Admin only command."
            }
        },
    },
    requiresRoles: ["dbcore", "admin"],
    init: function(client, imports) {

        var knex = imports.dbcore.knex;

        var dbResponsePromise = knex.migrate.latest({
            tableName: 'tennu_respond_knex_migrations',
            directory: path.join(__dirname, 'migrations')
        }).then(function() {
            return require('./lib/respond')(knex, client._logger.notice, client._logger.debug).then(function(respond) {
                return respond;
            });
        });

        var respondConfig = client.config("respond");

        var haste = require('./lib/pastebin')(respondConfig["pastebin-apikey"]);

        /**
         * Handles parsing subcommands out of !respond.
         **/
        function respondRouter() {
            return function(IRCMessage) {

                if (respondConfig["no-admin"] === true) {
                    return router(IRCMessage);
                }

                return imports.admin.requiresAdmin(router)(IRCMessage);

                function router(privmsg) {

                    switch (privmsg.args[0]) {
                        case 'list':
                            return list(privmsg);
                        case 'remove':
                            return remove(privmsg);
                        case 'edit':
                            return edit(privmsg);
                        case 'add':
                            return add(privmsg);
                        case 'addtriggers':
                            return addtriggers(privmsg);
                        default:
                            return _getNotice('Subcommand for respond not found. See !help respond and check your PMs.')
                    }
                }
            }
        }

        function emitResponse() {
            return function(IRCMessage) {
                return dbResponsePromise.then(function(respond) {
                        return respond.tryEmit(IRCMessage.message)
                    })
                    .then(function(responses) {

                        var executableResponses = _.filter(responses, { 'executable': 1 });
                        var responsesToReturn = _.map(_.filter(responses, { 'executable': 0 }), 'response');

                        // Todo, move to function?
                        return Promise.each(executableResponses, function(item) {
                                return exec(item.response)
                                    .then(function(execResult) {
                                        
                                        var stdout = execResult.stdout;
                                        var stderr = execResult.stderr;

                                        if(stderr)
                                        {
                                            throw Error(stderr);
                                        }
                                        
                                        var cleanedOutput = stdout.split('\n');
                                        responsesToReturn.push(...cleanedOutput);
                                        
                                    })
                                    .catch(function(stderr) {
                                        client.notice(IRCMessage.nickname, [
                                            'The executable response failed to execute.',
                                            stderr
                                        ]);
                                        client._logger.error(stderr);
                                    });
                            })
                            .then(function() {
                                return responseModifierFormat.parse(responsesToReturn, IRCMessage);
                            });

                    })
                    .then(function(formattedResponses) {
                        Promise.each(formattedResponses, function(intentArray) {
                            return Promise.each(intentArray, function(intent) {
                                client[intent.intent](intent.target, intent.message);
                            });
                        });
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
                        .then(function(link) {
                            return _getNotice(link);
                        })
                        .catch(function(err) {
                            client._logger.error('Tennu-respond: An error has occured when attempting to pastebin.');
                            client._logger.error(err);
                            return _getNotice(err)
                        })
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

            var sargs = parseArgs(IRCMessage.args, responseAddEditArgs);

            var executable = _.get(sargs, 'executable', false);
            var respondType = sargs._[1];
            var ID = sargs._[2];
            var text = sargs._.slice(3, sargs._.length).join(' ');

            var chance = _.get(sargs, 'chance', respondConfig["default-chance"]);
            if (!_.isUndefined(chance)) {
                chance = clamp.prototype.saturate(chance);
            }

            return Promise.try(validators.validateType(respondType))
                .then(function() {
                    return dbResponsePromise.then(function(respond) {
                        return respond.edit(respondType, ID, text, chance, executable);
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

            var sargs = parseArgs(IRCMessage.args, responseAddEditArgs);

            var chance = clamp.prototype.saturate(_.get(sargs, 'chance', respondConfig["default-chance"]));
            var executable = _.get(sargs, 'executable', false);
            var stringStart = (IRCMessage.message.indexOf('add') + 4);
            var resTrigData = IRCMessage.message.slice(stringStart, IRCMessage.message.length)
            
            // Remove -c and --e
            var trimmedAndFilteredStr = resTrigData.replace(/([-]+c=*\d*\.*\d*){1}/i, '').replace(/(\-\-e\w*){1}/i, '').trim();
            var choppedText = splitSlash(trimmedAndFilteredStr);

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
                    return respond.add(_.dropRight(cleanedTriggers), _.last(cleanedTriggers), chance, IRCMessage.nickname, executable);
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

                    var sargs = parseArgs(IRCMessage.args, responseAddEditArgs);

                    var chance = clamp.prototype.saturate(_.get(sargs, 'chance', respondConfig["default-chance"]));

                    var stringStart = (IRCMessage.message.indexOf(responseID) + responseID.length);
                    var resTrigData = IRCMessage.message.slice(stringStart, IRCMessage.message.length)
                    var trimmedAndFilteredStr = resTrigData.replace(/([-]+c=*\d*\.*\d*){1}/i, '').trim();
                    var choppedText = splitSlash(trimmedAndFilteredStr);

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

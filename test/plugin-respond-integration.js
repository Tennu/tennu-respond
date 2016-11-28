var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');
var MockIRCMessageBuilder = require('./mock-irccommand-builder');
var commandHandler = require("./command-handler");
var _isNotice = require("./is-notice");

var responseAddTests = function(dbResponsePromise, plugin) {

    var handle = commandHandler(plugin);

    describe('Plugin-respond integration', function() {
        describe('invalid subcommand', function() {
            it('Should return notice error when invalid subcommand', function() {
                var IRCMessage = MockIRCMessageBuilder('!respond dontexists');
                return Promise.try(function() {
                    return handle(IRCMessage);
                }).then(function(pluginResponse) {
                    _isNotice(pluginResponse);
                    assert.equal(pluginResponse.message, 'Subcommand for respond not found. See !help respond and check your PMs.');
                });
            });
        });

        describe('privmsg', function() {
            
            it('Should return response when a trigger with a 100% chance is hit', function(done) {
                var IRCMessage = {
                    channel: '#demo',
                    message: 'Hello World trigger five hit.'
                };
                return Promise.try(function() {
                    return plugin.handlers['privmsg'](IRCMessage);
                }).then(function(pluginResponse) {
                    done();
                });
            });
            it('Should return nothing when a trigger with a 0% chance is hit', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                        return respond.add('custom', 'c', 0.00, 'TestUser');
                    }).then(function(newResponse) {
                        return Promise.try(function() {
                                return respond.tryEmit('hello my custom world.');
                            })
                            .then(assert.fail)
                            .catch(function(err) {
                                assert.equal(err.type, 'respond.notriggerpassedchancecheck');
                            })
                            .then(function() {
                                done();
                            });
                    });
                });
            });
            it('Should return a response after a trigger with 100% chance is edited and hit', function(done) {
                dbResponsePromise.then(function(respond) {
                    return Promise.try(function() {
                            return respond.add('custom', 'c', 1.00, 'TestUser');
                        })
                        .then(function(newItems) {
                            var IRCMessage = MockIRCMessageBuilder('!respond edit trigger ' + newItems.triggers[0].id + ' 12hello32');
                            return handle(IRCMessage);
                        })
                        .then(function(newResponse) {
                            assert.equal(newResponse.message[0], 'UPDATED', '\tTrigger (ID:3338) "12hello32" (Chance: 100%)');
                        })
                        .then(function() {
                            var IRCMessage = MockIRCMessageBuilder('D');
                            return plugin.handlers['privmsg'](IRCMessage);
                        }).then(function(pluginResponse) {
                            done();
                        });
                });
            });
        });

        describe('respond list', function() {
            var IRCMessage = MockIRCMessageBuilder('!respond list');
            it('Should return haste key with a list of all responses and triggers', function(done) {
                return Promise.try(function() {
                    return handle(IRCMessage);
                }).then(function(pluginResponse) {
                    _isNotice(pluginResponse);
                    assert.equal((pluginResponse.message.indexOf('https://hastebin.com/') > -1), true);
                }).then(function() {
                    done();
                });
            });
            it('Should return help text when no responses in DB', function(done) {
                dbResponsePromise.then(function(respond) {
                    return new respond.Trigger().fetchAll().then(function(allTriggers) {
                            return allTriggers.invokeThen('destroy');
                        })
                        .then(function() {
                            return new respond.Response().fetchAll();
                        })
                        .then(function(allRespnses) {
                            return allRespnses.invokeThen('destroy');
                        });
                }).then(function() {
                    return handle(IRCMessage);
                }).then(function(pluginResponse) {
                    assert.equal(pluginResponse.message, 'There are no responses yet. Use "!help respond" to add some.');
                }).then(function() {
                    done();
                });
            });
        });
        describe('respond remove', function() {
            describe('Invalid usage', function() {
                it('Should return notice error on invalid type', function() {
                    var IRCMessage = MockIRCMessageBuilder('!respond remove poop -42');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Type must be "response" or "trigger"');
                    });
                });
                it('Should return notice error on invalid response ID', function() {
                    var IRCMessage = MockIRCMessageBuilder('!respond remove response -42');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, '-42 is not a valid response ID.');
                    });
                });
                it('Should return notice error on invalid trigger ID', function() {
                    var IRCMessage = MockIRCMessageBuilder('!respond remove trigger -42');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, '-42 is not a valid trigger ID.');
                    });
                });
            });
            describe('Valid usage', function() {
                describe('Response', function() {
                    it('Should return deleted response notice', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond remove response ' + response.get('id'));
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message.length, 4);
                                    assert.equal(pluginResponse.message[0], 'DELETED');
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });
                describe('Trigger', function() {
                    it('One of many triggers removed should return deleted trigger notice', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Trigger({
                                    'trigger': 'trigger two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond remove trigger ' + response.id);
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message.length, 2);
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                    it('Only triggers removed should return deleted response and trigger notice', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Trigger({
                                    'trigger': 'trigger six'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond remove trigger ' + response.id);
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message.length, 3);
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });
            });
        });
        describe('respond edit', function() {
            describe('invalid usage', function() {
                it('Should return notice error on invalid type', function() {
                    var IRCMessage = MockIRCMessageBuilder('!respond edit poop 0');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Type must be "response" or "trigger"');
                    });
                });
            })
            describe('response', function() {
                describe('Invalid usage', function() {
                    it('Should return notice error on invalid response ID', function() {
                        var IRCMessage = MockIRCMessageBuilder('!respond edit response 0 hello World');
                        return Promise.try(function() {
                            return handle(IRCMessage);
                        }).then(function(pluginResponse) {
                            _isNotice(pluginResponse);
                            assert.equal(pluginResponse.message, '0 is not a valid response ID.');
                        });
                    });
                    it('Should return notice error on response missing text', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond edit response ' + response.get('id'));
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message, 'You must provide new text for the response');
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });
                describe('Valid usage', function() {
                    it('Should edit a response and return human readable confirmation', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond edit response ' + response.get('id') + ' hello World');
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message.length, 2);
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });
            });
            describe('trigger', function() {
                describe('Invalid usage', function() {
                    it('Should return notice error on invalid trigger ID', function() {
                        var IRCMessage = MockIRCMessageBuilder('!respond edit trigger 0 hello World');
                        return Promise.try(function() {
                            return handle(IRCMessage);
                        }).then(function(pluginResponse) {
                            _isNotice(pluginResponse);
                            assert.equal(pluginResponse.message, '0 is not a valid trigger ID.');
                        });
                    });
                    it('Should return notice error on trigger missing text', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Trigger({
                                    'trigger': 'trigger two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond edit trigger ' + response.get('id'));
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message, 'You must provide new text for the trigger');
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                    it('Should clamp on invalid chance', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Trigger({
                                    'trigger': 'trigger two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond edit trigger -c=101 ' + response.get('id') + ' hello World');
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message.length, 2);
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                    it('Should clamp chance when real ID provided', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Trigger({
                                    'trigger': 'trigger two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond edit trigger -c=101 ' + response.get('id') + ' hello World');
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message.length, 2);
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                    it('Should return notice error on valid chance when bogus ID provided', function() {
                        var IRCMessage = MockIRCMessageBuilder('!respond edit trigger 0 -c=1.00 hello World');
                        return Promise.try(function() {
                            return handle(IRCMessage);
                        }).then(function(pluginResponse) {
                            'At least one trigger is required. See "!help respond add"'
                            _isNotice(pluginResponse);
                            assert.equal(pluginResponse.message, '0 is not a valid trigger ID.');
                        });
                    });
                });
                describe('Valid usage', function() {
                    it('Should edit a trigger and return human readable confirmation', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Trigger({
                                    'trigger': 'trigger two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond edit trigger ' + response.get('id') + ' -c=.25 argue');
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                }).then(function(pluginResponse) {
                                    _isNotice(pluginResponse);
                                    assert.equal(pluginResponse.message.length, 2);
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });
            });
        });
        describe('respond add', function() {
            describe('Invalid usage', function() {
                it('Should return error notice when missing args', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond add -c=1.00 1 a');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'At least one trigger is required. See "!help respond add"');
                        done();
                    });
                });
                it('Should return error notice whenresponse ID missing', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond add -c=1.00 1/ /a');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Trigger or response missing.');
                        done();
                    });
                });
                it('Should return error notice when args invalid', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond add -c=1.00 1 a/');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'At least one trigger is required. See "!help respond add"');
                        done();
                    });
                });
                it('Should return error notice when chance invalid', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond add -c 1 a/');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        done();
                    });
                });
                it('Should return error notice when ID invalid', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond add 0 -c1 a/b');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        done();
                    });
                });
            });
            describe('Valid usage', function() {
                it('Should add two triggers and a response with a 100% chance', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond add -c=1.00 1 a/2-/--3 b ');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message[0], 'ADDED');
                        assert.equal(pluginResponse.message.length, 4);
                        done();
                    });
                });
            });
        });
        describe('respond addtriggers', function() {
            describe('Invalid usage', function() {
                it('Should return error notice whenresponse ID missing', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond addtriggers -c=1.00 1/ /a');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Response ID missing.');
                        done();
                    });
                });
                it('Should return error notice when args with whitespace added', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond addtriggers 0 -c=1.00 1/ /a');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Trigger or response missing.');
                        done();
                    });
                });
                it('Should return error notice when args invalid', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond addtriggers 0 -c=1.00 1 a/');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Invalid response ID.');
                        done();
                    });
                });
                it('Should return error notice when ID invalid', function(done) {
                    var IRCMessage = MockIRCMessageBuilder('!respond addtriggers 0 -c1 a/b');
                    return Promise.try(function() {
                        return handle(IRCMessage);
                    }).then(function(pluginResponse) {
                        _isNotice(pluginResponse);
                        done();
                    });
                });
            });
            describe('Valid usage', function() {
                it('Should add two triggers and a response with a 100% chance', function(done) {
                    dbResponsePromise.then(function(respond) {
                        return Promise.try(function() {
                            return new respond.Response({
                                'response': 'response two'
                            }).fetch({
                                require: true
                            });
                        }).then(function(response) {
                            var IRCMessage = MockIRCMessageBuilder('!respond addtriggers ' + response.get('id') + ' -c=1.00 1 a/2-/--3 b ');
                            return Promise.try(function() {
                                return handle(IRCMessage);
                            }).then(function(pluginResponse) {
                                _isNotice(pluginResponse);
                            });
                        }).then(function() {
                            done();
                        });
                    });
                });
            });
        });
    });
};

module.exports = responseAddTests;
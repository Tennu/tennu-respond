var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');
var MockIRCMessageBuilder = require('./mock-irccommand-builder');

function commandHandler(plugin) {
    return function(IRCMessage) {
        return plugin.handlers[IRCMessage.command](IRCMessage);
    };
};

function _isNotice(object) {
    assert.equal(_.isEqual(_.omit(object, 'message'), {
        intent: 'notice',
        query: 'true'
    }), true);
}

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
                    message: 'Hello World trigger five hit.'
                };
                return Promise.try(function() {
                    return plugin.handlers['privmsg'](IRCMessage);
                }).then(function(pluginResponse) {
                    assert.deepEqual(pluginResponse, ['response two']);
                    done();
                });
            });
        });
        describe('respond list', function() {
            var IRCMessage = MockIRCMessageBuilder('!respond list');
            it('Should return haste key with a list of all responses and triggers', function() {
                return Promise.try(function() {
                    return handle(IRCMessage);
                }).then(function(pluginResponse) {
                    _isNotice(pluginResponse);
                    assert.equal((pluginResponse.message.indexOf('https://hastebin.com/') > -1), true);
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
                    it('Should return....', function(done) {
                        dbResponsePromise.then(function(respond) {
                            return Promise.try(function() {
                                return new respond.Response({
                                    'response': 'response two'
                                }).fetch({
                                    require: true
                                });
                            }).then(function(response) {
                                var IRCMessage = MockIRCMessageBuilder('!respond remove response ' + response.id);
                                return Promise.try(function() {
                                    return handle(IRCMessage);
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });
                describe('Trigger', function() {
                    it('One of many triggers removed should return....', function(done) {
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
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                    it('Only triggers removed should return....', function(done) {
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
                                });
                            }).then(function() {
                                done();
                            });
                        });
                    });
                });                
            });
        });
    });
};

module.exports = responseAddTests;
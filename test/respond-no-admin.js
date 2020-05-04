var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');
var MockIRCMessageBuilder = require('./mock-irccommand-builder');
var commandHandler = require("./command-handler");
var isNotice = require('./is-notice');

var responseNoAdminTests = function(plugin, client, imports) {

    var handle = commandHandler(plugin);

    function executeRespondList() {
        var IRCMessage = MockIRCMessageBuilder('!respond list');

        return Promise.try(function() {
                return handle(IRCMessage);
            })
            .then(function(pluginResponse) {
                assert.equal(pluginResponse, 'Permission denied.');
            });
    }

    describe('respond no-admin', function() {

        after(function() {
            client.clientConfiguration.respond["no-admin"] = true;
        });

        describe('no-admin === undefined', function() {

            before(function() {
                client.clientConfiguration.respond["no-admin"] = undefined;
            });

            it('Should deny access to non-admins.', function(done) {
                
                executeRespondList()
                    .then(function() {
                        done();
                    });
                    
            });

        });

        describe('no-admin === false', function() {

            before(function() {
                client.clientConfiguration.respond["no-admin"] = false;
            });

            it('Should deny access to non-admins.', function(done) {

                executeRespondList()
                    .then(function() {
                        done();
                    });

            });

            it('Should allow access to an admin.', function() {

                var IRCMessage = MockIRCMessageBuilder('!respond list');

                IRCMessage.hostmask.hostname = 'admin.admin.admin';

                return Promise.try(function() {
                        return handle(IRCMessage);
                    })
                    .then(function(pluginResponse) {
                        isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Provide a Pastebin API Key in your configuration to enable this feature.');
                    });

            });

        });

        describe('no-admin === true', function() {

            before(function() {
                client.clientConfiguration.respond["no-admin"] = true;
            });

            it('Should allow access to a non-admin.', function() {

                var IRCMessage = MockIRCMessageBuilder('!respond list');

                IRCMessage.hostmask.hostname = 'test.test.test';

                return Promise.try(function() {
                        return handle(IRCMessage);
                    })
                    .then(function(pluginResponse) {
                        isNotice(pluginResponse);
                        assert.equal(pluginResponse.message, 'Provide a Pastebin API Key in your configuration to enable this feature.');
                    });

            });

        });

    });

};

module.exports = responseNoAdminTests;

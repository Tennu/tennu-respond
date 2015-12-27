var assert = require("assert");
var _ = require("lodash");
var Promise = require('bluebird');

var responseAddTests = function(plugin) {
    describe('Plugin-respond integration', function() {
        describe('privmsg', function() {
            it('Should return response when a trigger with a 100% chance is hit.', function() {
                var IRCMessage = {
                    message: 'Hello World trigger five hit.'
                };
                return Promise.try(function(){
                    return plugin.handlers['privmsg'](IRCMessage);
                }).then(function(pluginResponse){
                    console.log(pluginResponse);
                });
            });
        });
    });
};

module.exports = responseAddTests;
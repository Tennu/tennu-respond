var assert = require("assert");
var _ = require('lodash');
var intentModifierFormat = require('../lib/response-modifier-format');

function tests() {
    describe('Variable formatter', function() {
        describe('Modifiers', function() {
            it('%act% should work', function(done) {
                intentModifierFormat.parse(["%act%world"])
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'act',
                                message: 'world'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%say% should work', function(done) {
                intentModifierFormat.parse(["%say%world"])
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'say',
                                message: 'world'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%notice% should work', function(done) {
                intentModifierFormat.parse(["%notice%world"])
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'notice',
                                message: 'world'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%rainbow% should work', function(done) {
                intentModifierFormat.parse(["%rainbow%world"])
                    .then(function(result) {
                        assert.equal(_.has(result[0][0], 'message', false), true);
                        assert.equal(_.get(result[0][0], 'intent', false), 'say');
                        done();
                    });
            });
        });
        describe('Modifier edge cases', function() {
            it('hello%act%world should convert hello to a say intent', function(done) {
                intentModifierFormat.parse(["hello%act%world"])
                    .then(function(result) {
                        assert.equal(_.any(result[0], {
                            intent: 'say',
                            message: 'hello'
                        }), true);
                        done();
                    });
            });
            it('hello%act% should return only one say intent', function(done) {
                intentModifierFormat.parse(["hello%act%"])
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'act',
                                message: 'hello'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%act% should return an empty array', function(done) {
                intentModifierFormat.parse(["%act%"])
                    .then(function(result) {
                        assert.equal(_.isEqual(result, []), true);
                        done();
                    });
            });
        });
    });
}

module.exports = tests;
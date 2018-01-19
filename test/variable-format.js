var assert = require("assert");
var _ = require('lodash');
var intentModifierFormat = require('../lib/response-modifier-format');

function tests() {
    describe('Variable formatter', function() {
        describe('Modifiers', function() {
            it('%act% should work', function(done) {
                intentModifierFormat.parse(["%act%world"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'act',
                                target: '#test',
                                message: 'world'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%say% should work', function(done) {
                intentModifierFormat.parse(["%say%world"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'say',
                                target: '#test',
                                message: 'world'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%notice% should work', function(done) {
                intentModifierFormat.parse(["%notice%world"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'notice',
                                target: '#test',
                                message: 'world'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%rainbow% should work', function(done) {
                intentModifierFormat.parse(["%rainbow%world"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.has(result[0][0], 'message', false), true);
                        assert.equal(_.get(result[0][0], 'intent', false), 'say');
                        done();
                    });
            });
            it('%private% should work', function(done) {
                intentModifierFormat.parse(["%private%world"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.has(result[0][0], 'message', false), true);
                        assert.equal(_.get(result[0][0], 'intent', false), 'say');
                        done();
                    });
            });            
        });
        describe('Modifier edge cases', function() {
            it('hello%act%world should convert hello to a say intent', function(done) {
                intentModifierFormat.parse(["hello%act%world"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.some(result[0], {
                            intent: 'say',
                            target: '#test',
                            message: 'hello'
                        }), true);
                        done();
                    });
            });
            it('hello%act% should return only one say intent', function(done) {
                intentModifierFormat.parse(["hello%act%"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.isEqual(result, [
                            [{
                                intent: 'act',
                                target: '#test',
                                message: 'hello'
                            }]
                        ]), true);
                        done();
                    });
            });
            it('%act% should return an empty array', function(done) {
                intentModifierFormat.parse(["%act%"], { channel: '#test', nickname: 'freddy' })
                    .then(function(result) {
                        assert.equal(_.isEqual(result, []), true);
                        done();
                    });
            });
        });
    });
}

module.exports = tests;
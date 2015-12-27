var assert = require('assert');

const masterNickname = 'TheCreator';

var cacheTests =
    function(dbResponsePromise) {

        describe('Cache', function() {

            var cache = require('../lib/cache');

            var itemPromise = dbResponsePromise.then(function(respond) {
                return new respond.Trigger({
                    trigger: 'Hello World',
                    chance: 0.03,
                    created_by: masterNickname
                });
            });

            describe('#add()', function() {
                it('Should add cache item', function(done) {
                    itemPromise.then(function(item) {
                        var beginingLength = cache.triggerCache.length;
                        cache.add(item);
                        assert.equal(beginingLength, cache.triggerCache.length - 1);
                        done();
                    });
                });
            });

            describe('#update()', function() {
                it('Should update cache item', function(done) {
                    itemPromise.then(function(item) {
                        item.set('trigger', 'Hello Mars');
                        cache.add(item);
                        cache.update(item);
                        assert.deepEqual({
                            trigger: 'Hello Mars',
                            chance: 0.03,
                            created_by: masterNickname
                        }, cache.triggerCache[6].toJSON());
                        done();
                    });
                });
            });

            describe('#remove()', function() {
                it('Should remove cache item', function(done) {
                    itemPromise.then(function(item) {
                        cache.add(item);
                        var beginingLength = cache.triggerCache.length;
                        cache.remove(item);
                        assert.equal(beginingLength, cache.triggerCache.length + 1);
                        done();
                    });
                });
            });

            describe('#clear()', function() {
                it('Should clear the triggerCache', function() {
                    cache.clear();
                    assert.equal(cache.triggerCache.length, 0);
                });
            });

        });
    };

module.exports = cacheTests;
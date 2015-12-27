var _ = require('lodash');

var triggerCache = [];

function add(model) {
    this.triggerCache.push(model);
}

function remove(model) {
    this.triggerCache = this.triggerCache.filter(function(cacheItem) {
        return cacheItem.get("id") !== model.previous("id");
    });
}

function update(model) {
    this.triggerCache.map(function(cacheItem) {
        if (cacheItem.id === model.id) {
            _.assign(cacheItem, model);
        }
    });
}

function clear (){
    var spliceLength = this.triggerCache.length;
    this.triggerCache.splice(0, spliceLength);
}

module.exports = {
    triggerCache: triggerCache,
    add: add,
    remove: remove,
    update: update,
    clear: clear
};
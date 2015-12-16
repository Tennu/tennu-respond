var rules = require('./rules');
var cache = require('./cache');

function models (bookshelf) {
    
    var Response = bookshelf.Model.extend({
        tableName: 'response',
        hasTimestamps: true,
        triggers: function() {
            return this.hasMany(Trigger);
        },
        initialize: function() {
            this.on('saving', this.validateSave);
        },
        validateSave: function() {
            return rules.responseRules.run(this.attributes);
        },

    });

    var Trigger = bookshelf.Model.extend({
        tableName: 'trigger',
        hasTimestamps: true,
        respond: function() {
            return this.belongsTo(Response);
        },
        initialize: function() {

            this.on('saving', this.validateSave);

            // Cache methods
            this.on('created', this.cacheAdd);
            this.on('destroyed', this.cacheRemove);
            this.on('updated', this.cacheUpdate);
        },

        validateSave: function() {
            return rules.triggerRules.run(this.attributes);
        },

        cacheAdd: cacheAdd,

        cacheRemove: cacheRemove,

        cacheUpdate: cacheUpdate
    })

    var Responses = bookshelf.Collection.extend({
        model: Response
    });

    var Triggers = bookshelf.Collection.extend({
        model: Trigger
    });

    function cacheAdd (model, attrs, options) {
        cache.add(model);
    }

    function cacheRemove (model, attrs, options) {
        cache.remove(model);
    }

    function cacheUpdate (model, attrs, options) {
        cache.update(model);
    }

    return {
        // Bookshelf
        Response: Response,
        Trigger: Trigger,
        Responses: Responses,
        Triggers: Triggers,
        
        // Cache
        cache: cache
    };
}

module.exports = models;
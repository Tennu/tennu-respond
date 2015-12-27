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
            this.on('creating', this.validateCreating);
            this.on('saving', this.validateSaving);
        },
        validateCreating: function() {
            return rules.responseCreatingRules.run(this.attributes);
        },
        validateSaving: function() {
            return rules.responseSavingRules.run(this.attributes);
        }
    });

    var Trigger = bookshelf.Model.extend({
        tableName: 'trigger',
        hasTimestamps: true,
        response: function() {
            return this.belongsTo(Response);
        },
        initialize: function() {

            this.on('creating', this.validateCreating);
            this.on('saving', this.validateSaving);

            // Cache methods
            this.on('created', this.cacheAdd);
            this.on('destroyed', this.cacheRemove);
            this.on('updated', this.cacheUpdate);
        },

        validateCreating: function() {
            return rules.triggerCreatingRules.run(this.attributes);
        },
        
        validateSaving: function() {
            return rules.triggerSavingRules.run(this.attributes);
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
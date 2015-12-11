var rules = require('./rules');

function models(bookshelf) {
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
        
        cacheAdd: function() {
            // Move outside
        },

        cacheRemove: function() {
            // Move outside
        },
        
        cacheUpdate: function() {
            // Move outside
        }        
    })

    var Responses = bookshelf.Collection.extend({
        model: Response
    });

    var Triggers = bookshelf.Collection.extend({
        model: Trigger
    });

    return {
        Response: Response,
        Trigger: Trigger,
        Responses: Responses,
        Triggers: Triggers,
    };
}

module.exports = models;
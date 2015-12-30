var Checkit = require('checkit');
var _ = require('lodash');

var triggerCreatingRules = new Checkit({
    trigger: ['required', customTriggerValidator],
    chance: ['required', 'numeric', 'greaterThanEqualTo:0', 'lessThanEqualTo:1'],
    created_by: 'required'
});

var responseCreatingRules = new Checkit({
    response: ['required', string],
    created_by: 'required'
});

var triggerSavingRules = new Checkit({
    trigger: ['required', customTriggerValidator],
    chance: ['required', 'numeric', 'greaterThanEqualTo:0', 'lessThanEqualTo:1']
});

var responseSavingRules = new Checkit({
    response: ['required', string]
});

function customTriggerValidator(val) {
    if (typeof(val) !== "string") {
        throw new Error('Trigger must be a string or an array.');
    }
}

function string(val) {
    if (!_.isString(val)) {
        throw new Error('Value must be a string.');
    }
}

module.exports = {
    triggerCreatingRules: triggerCreatingRules,
    responseCreatingRules: responseCreatingRules,
    triggerSavingRules: triggerSavingRules,
    responseSavingRules: responseSavingRules
};
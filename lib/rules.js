var Checkit = require('checkit');

var triggerRules = new Checkit({
    trigger: ['required', customTriggerValidator],
    chance: ['required', 'numeric', 'greaterThanEqualTo:0', 'lessThanEqualTo:1'],
    created_by: 'required'
});

var responseRules = new Checkit({
    response: ['required', string],
    created_by: 'required'
});

function customTriggerValidator(val) {
    if (typeof(val) !== "string") {
        throw new Error('Trigger must be a string or an array.');
    }
}

function string(val) {
    if (typeof(val) !== "string") {
        throw new Error('Value must be a string.');
    }
}

module.exports = {
    triggerRules: triggerRules,
    responseRules: responseRules
};
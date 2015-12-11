var Checkit = require('checkit');

var triggerRules = new Checkit({
    trigger: ['required', triggerStringOrArray],
    chance: ['between:0.00:1.00'],
    created_by: 'required'
});

var responseRules = new Checkit({
    response: ['required'],
    created_by: 'required'
});

function triggerStringOrArray(val)
{
    if(stringOrArray(val))
    {
        throw new Error('Trigger must be a string or an array.');
    }
}

function stringOrArray(val){
    if(!Array.isArray(val) || typeof(val) !== "string")
    {
        return true;
    }
    return false;
}

module.exports = {
    triggerRules: triggerRules,
    responseRules: responseRules
};
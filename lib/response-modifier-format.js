var _ = require('lodash');
var Promise = require('bluebird');
var textFormat = require('irc-formatters');

const intentModifierMapping = {
    '%act%': 'act',
    '%notice%': 'notice',
    '%say%': 'say',
    '%rainbow%': 'say'
    //'%greentext%'' not supported because slashes are required
    // '%pm%': 'say' // todo, sending a pm would require a target, and im not sure how to do that in text in a nice way
};

var unWrappedIntentModifiers = _.keys(intentModifierMapping).map(function(key) {
    return key.replace(/\%/g, '');
}).join('|');

const variableRE = new RegExp('\%[' + unWrappedIntentModifiers + ']+\%', 'g');

function parse(responses, IRCMessage) {
    
    if(_.isString(responses)){
        responses = [responses];
    }
    
    return Promise.reduce(responses, function(accumulator, response) {

        var splitText = _.reject(response.split(variableRE), _.isEmpty);
        if (splitText.length === 0) {
            return accumulator;
        }

        var matchedVariables = response.match(variableRE) || ['%say%']; // If this is null, no matches found. default to say.
        
        // Account for a message without a beginning variable: "hello%act%world"
        if (matchedVariables.length < splitText.length) {
            matchedVariables.unshift('%say%')
        }

        // Here we match the chopped text up to an intent modifier (variable)
        var newMapping = splitText.map(function(text, i) {
            if(matchedVariables[i] === '%rainbow%'){
                text = textFormat.rainbow(text);
            }
            
            if(text.indexOf('%nick%') > -1){
                text = text.replace(/%nick%/g, IRCMessage.nickname);
            }
            
            return {
                intent: intentModifierMapping[matchedVariables[i]],
                message: text
            };
        });

        accumulator.push(newMapping);
        
        return accumulator;

    }, []);
}


module.exports = {
    parse: parse
};
var TypedError = require("error/typed");
var format = require('util').format;

var RespondNoTriggerError = TypedError({
    type: 'respond.notrigger',
    message: 'No trigger for message {userMessage}',
});

var RespondTriggerNullOrEmptyError = TypedError({
    type: 'respond.triggernullorempty',
    message: 'Triggers cannot be null or empty.',
});

var RespondResponseNullOrEmptyError = TypedError({
    type: 'respond.responsenullorempty',
    message: 'Response cannot be null or empty.',
});

var RespondTypeInvalidError = TypedError({
    type: 'respond.typeinvalid',
    message: 'Respond types must be either a response, or a trigger. Provded: {responseType}',
});

var RespondTriggerArrayEmptyError = TypedError({
    type: 'respond.triggerarrayempty',
    message: 'Array can not be empty.',
});

var ParameterNotStringError = TypedError({
    type: 'respond.parameternotstring',
    message: '{param} must be a valid string'
});

module.exports = {
    RespondNoTriggerError: RespondNoTriggerError,
    RespondTriggerNullOrEmptyError: RespondTriggerNullOrEmptyError,
    RespondResponseNullOrEmptyError: RespondResponseNullOrEmptyError,
    RespondTriggerArrayEmptyError: RespondTriggerArrayEmptyError,
    RespondTypeInvalidError: RespondTypeInvalidError,
    
    ParameterNotStringError: ParameterNotStringError
};
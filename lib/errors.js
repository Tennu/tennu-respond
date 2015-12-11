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

// var RespondTriggerValueEmptyError = TypedError({
//     type: 'respond.triggervalueempty',
//     message: 'Trigger must have a value.',
// });

// var RespondResponseOrTriggerNaNError = TypedError({
//     type: 'respond.responsortriggernan',
//     message: 'ID is not a number.',
// });

module.exports = {
    RespondNoTriggerError: RespondNoTriggerError,
    RespondTriggerNullOrEmptyError: RespondTriggerNullOrEmptyError,
    RespondResponseNullOrEmptyError: RespondResponseNullOrEmptyError,
    //RespondTriggerValueEmptyError: RespondTriggerValueEmptyError
};
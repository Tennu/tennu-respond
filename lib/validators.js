var error = require('./errors');
/**
 * Private
 * Provides a function that will throw an error if an invalid responseTypeis provided.
 * Only 'response' and 'trigger' are valid types.
 * @param {Number} id
 * @return {Function}
 */
function validateType(responseType) {
    return function() {
        if (responseType !== 'response' && responseType !== 'trigger') {
            throw error.RespondTypeInvalidError({
                responseType: responseType
            })
        }
    }
}

module.exports = {
    validateType: validateType
};
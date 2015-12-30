var format = require('util').format;
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');

const dateFormatStr = 'YYYY-MM-DD HH:mm';

/**
 * Takes a json object which is a representation of Respond's bookshelf models
 * @param {Object} JSONPayload of bookshelf respond models with related triggers
 * @return {String} human readable response
 */
function formatAll(JSONPayload) {
    var dateFormatStr = 'YYYY-MM-DD HH:mm';
    return _.reduce(JSONPayload, function(total, response) {
        var responseStr = formatResponse(response);
        responseStr += _.reduce(response.triggers, function(triggerTotal, trigger) {
            var triggerStr = formatTrigger(trigger)
            return triggerTotal + triggerStr
        }, '');
        return total + responseStr;
    }, '');
}

/**
 * Takes a json object which is a representation of Respond's bookshelf trigger model
 * @param {Object} bookshelf model trigger
 * @return {String} human readable response
 */
function formatTrigger(trigger) {
    return format('\tTrigger (ID:%s) "%s" (Chance: %s%) created by: %s [created %s] [updated %s]\n',
        trigger.id,
        trigger.trigger,
        parseFloat(trigger.chance) * 100,
        trigger.created_by,
        moment(trigger.created_on).format(dateFormatStr),
        moment(trigger.updated_on).format(dateFormatStr));
}

/**
 * Takes a json object which is a representation of Respond's bookshelf response model
 * @param {Object} bookshelf model response
 * @return {String} human readable response
 */
function formatResponse(response) {
    return format('\nResponse (ID:%s) "%s" created by: %s [created %s] [updated %s]\n',
        response.id,
        response.response,
        response.created_by,
        moment(response.created_on).format(dateFormatStr),
        moment(response.updated_on).format(dateFormatStr));
}

/**
 * Takes a json object which is a representation of Respond's bookshelf trigger model after a patch save
 * @param {Object} bookshelf model trigger
 * @return {String} human readable response
 */
function formatUpdatedTrigger(trigger) {
    return format('\tTrigger (ID:%s) "%s" (Chance: %s%) [updated %s]\n',
        trigger.id,
        trigger.trigger,
        parseFloat(trigger.chance) * 100,
        moment(trigger.updated_on).format(dateFormatStr));
}

/**
 * Takes a json object which is a representation of Respond's bookshelf response model after a patch save
 * @param {Object} bookshelf model response
 * @return {String} human readable response
 */
function formatUpdatedResponse(response) {
    return format('\nResponse (ID:%s) "%s" [updated %s]\n',
        response.id,
        response.response,
        moment(response.updated_on).format(dateFormatStr));
}

/**
 * Takes a string created by a format function above and breaks it on newlines, and replacing tabs with spaces.
 * @param {String} formatted models
 * @return {Array} tennu friendly array of strings
 */
function formatTennuResponseFriendly(formatted, action) {
    return Promise.filter(formatted.split('\n'), function(line) {
            if (!_.isEmpty(line)) {
                return line;
            }
        })
        .map(function(line) {
            // Todo...
            return line.replace(/\\t/g, '---->');
        }).then(function(messages) {
            return [action].concat(messages);
        });
}

module.exports = {
    formatAll: formatAll,
    formatTrigger: formatTrigger,
    formatResponse: formatResponse,
    formatUpdatedTrigger: formatUpdatedTrigger,
    formatUpdatedResponse: formatUpdatedResponse,
    formatTennuResponseFriendly: formatTennuResponseFriendly
}
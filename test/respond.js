var _ = require("lodash");

var responseTryEmit = require("./respond-try-emit");
var responseAdd = require("./respond-add");
var responseAddTriggers = require("./respond-add-triggers");
var responseRemove = require("./respond-remove");
var responseEdit = require("./respond-edit");
var responseGetAll = require("./respond-get-all");

var respondTests = function(dbResponsePromise) {

    describe('Respond', function() {

        responseTryEmit(dbResponsePromise);

        responseAdd(dbResponsePromise);

        responseAddTriggers(dbResponsePromise);

        responseRemove(dbResponsePromise);

        responseEdit(dbResponsePromise);

        responseGetAll(dbResponsePromise);

    });

};

module.exports = respondTests;
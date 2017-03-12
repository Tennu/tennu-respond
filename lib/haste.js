var fetch = require('node-fetch');

var postText = function(text) { // Returns promise with key as argument.
	var self = this;
	text = '' + text;
	if (!text) {
		return null;
	}
	var options = {
		method: 'POST',
		body: text
	};
	return fetch(self.hasteServerHost + 'documents', options).then(function(res) {
		return res.json();
	}).then(function(json) {
		return json.key;
	});
};

var getText = function(key) {
	throw new Error('Not implemented exception.');
};

module.exports = function(hasteServerHost) {
	return {
		hasteServerHost: hasteServerHost,

		postText: postText,
		getText: getText
	}
}

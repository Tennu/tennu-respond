var fetch = require('node-fetch');

var postText = function (text) { // Returns promise with key as argument.
	text = ''+text;
	if (!text) return null;
	var options = {
	  method: 'POST',
	  body: text
	};
	return fetch('http://hastebin.com/documents', options).then(function (res) {
		return res.json();
	}).then(function (json) {
		return json.key;
	});
};

var getText = function (key) {
    throw new Error('Not implemented exception.');
};

module.exports = {
	postText: postText,
	getText: getText
}
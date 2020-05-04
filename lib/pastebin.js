const PastebinAPI = require('pastebin-js');
const _ = require('lodash');
const moment = require('moment');

var postText = function(text) { // Returns promise with key as argument.
	var self = this;

	text = '' + text;

	if (!text) {
		return null;
	}

	return self.pastebin.createPaste({
		text: text,
		title: `Tennu Respond List - ${moment().format("YYYY-MM-DD_HH-mm-SS")}`,
		format: 'text',
		privacy: 1, // Unlisted (mus use this otherwise username and pass needed)
		expiration: null,
	});
};

module.exports = function(apiKey) {

	if(_.isUndefined(apiKey)){
		return {
			postText: () => new Promise(function(resolve, reject) {
				return reject("Provide a Pastebin API Key in your configuration to enable this feature.")
			})
		}
    }
    
	return {
		pastebin: new PastebinAPI(apiKey),
		postText: postText
	}
}

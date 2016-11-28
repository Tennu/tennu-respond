function commandHandler(plugin) {
    return function(IRCMessage) {
        return plugin.handlers[IRCMessage.command](IRCMessage);
    };
};

module.exports = commandHandler;
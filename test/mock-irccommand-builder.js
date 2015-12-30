module.exports = function(message){
    var args = message.split(/ +/);
    return {
        message: message,
        args: args,
        command: args.shift().toLowerCase()
    };
};
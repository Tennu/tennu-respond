module.exports = function(message){
    var args = message.split(/ +/);
    return {
        message: message,
        args: args,
        nickname: 'Test_User',
        command: args.shift().toLowerCase()
    };
};
module.exports = function(message){
    var args = message.split(/\s+/);
    return {
        message: message,
        args: args,
        nickname: 'Test_User',
        command: args.shift().toLowerCase(),
        hostmask: {
            nickname: "test123",
            hostname: "test.test.test"
        }
    };
};
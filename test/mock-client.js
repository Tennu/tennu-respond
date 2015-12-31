function logger() {
    return {
        "notice": function(text) {
            console.info(text);
        },
        "debug": function(text) {
            console.info(text);
        },
        "error": function(text) {
            console.error('ERROR SENT TO TENNU_CLIENT._LOGGER.ERROR');
        }
    }
}

function config(value) {
    var cfg = {
        "respond": {
            "defaultChance": 0.3
        },
        "database": {
            "client": "sqlite3",
            "debug": false,
            "connection": {
                "filename": "./test/Respond.tests.sqlite"
            }
        }
    }
    return cfg[value];
}

module.exports = {
    "config": config,
    "_logger": logger()
};
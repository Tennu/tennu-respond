function logger() {
    return {
        "notice": function(text) {
            //console.info(text);
        },
        "debug": function(text) {
            //console.info(text);
        }
    }
}

function config(value) {
    var cfg = {
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
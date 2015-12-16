function be(dbResponsePromise) {
    return function(done) {
        this.timeout(5000);
        return dbResponsePromise.then(function(respond) {

            // Clear Cache
            respond.triggerCache.clear();

            // Clear Database
            return new respond.Trigger().fetchAll().then(function(allTriggers) {
                    return allTriggers.invokeThen('destroy');
                })
                .then(function() {
                    return new respond.Response().fetchAll();
                })
                .then(function(allRespnses) {
                    return allRespnses.invokeThen('destroy');
                })
                .then(function() {
                    return new respond.Responses([{
                        response: 'response one.',
                        created_by: 'TestUser'
                    }, {
                        response: 'response two.',
                        created_by: 'TestUser'
                    }, {
                        response: 'response three.',
                        created_by: 'TestUser'
                    }]).invokeThen('save');
                })
                .then(function(responses) {
                    return responses[0].related('triggers').add([{
                            response_id: responses[0].id,
                            trigger: 'trigger one',
                            chance: 0.03,
                            created_by: 'TestUser2'
                        }, {
                            response_id: responses[0].id,
                            trigger: 'trigger two',
                            chance: 0.43,
                            created_by: 'TestUser2'
                        }, {
                            response_id: responses[0].id,
                            trigger: 'trigger three',
                            chance: 0.93,
                            created_by: 'TestUser2'
                        }]).invokeThen('save')
                        .then(function() {
                            return responses[1].related('triggers').add([{
                                response_id: responses[1].id,
                                trigger: 'trigger four',
                                chance: 0.01,
                                created_by: 'TestUser2'
                            }, {
                                response_id: responses[1].id,
                                trigger: 'trigger five',
                                chance: 1.00,
                                created_by: 'TestUser2'
                            }]).invokeThen('save');
                        }).then(function() {
                            return responses[2].related('triggers').create({
                                trigger: 'trigger six',
                                chance: 0.01,
                                created_by: 'TestUser2'
                            });
                        });
                })
                .then(function(test) {
                    done();
                });
        });
    };

}

module.exports = be;
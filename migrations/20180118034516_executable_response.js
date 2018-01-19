exports.up = function(knex, Promise) {
    return knex.schema.table('response', function(table) {
        table.boolean('executable').notNull().defaultTo(false);
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table('response', function(t) {
        t.dropColumn('executable');
    });
};

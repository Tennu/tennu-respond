exports.up = function(knex, Promise) {
      return knex.schema.createTableIfNotExists("response", function(table) {
        table.increments("id").primary();
        table.string("response").notNullable();
        table.string("created_by").notNullable();
        table.timestamps();
    }).then(function(){
        return knex.schema.createTableIfNotExists("trigger", function(table) {
            table.increments("id").primary();
            table.string("trigger").notNullable();
            table.decimal('chance').notNullable();
            table.integer("response_id").unsigned().notNullable().references("ID").inTable("response");
            table.string("created_by").notNullable();
            table.timestamps();
        });
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("respond").then(function(){
      return knex.schema.dropTableIfExists("trigger");
  });
};
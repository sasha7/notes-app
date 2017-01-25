exports.up = (knex, Promise) => knex.schema
  .createTable('notes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title');
    table.string('body');
  });

exports.down = (knex, Promise) => knex.schema
  .dropTableIfExists('notes');

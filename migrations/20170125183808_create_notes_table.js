exports.up = (knex, Promise) => knex.schema
  .createTable('notes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title');
    table.string('body', 1000);
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw('now()'));
  });

exports.down = (knex, Promise) => knex.schema
  .dropTableIfExists('notes');

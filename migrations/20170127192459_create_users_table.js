
exports.up = (knex, Promise) => knex.schema
  .createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('username');
    table.string('password');
  });

exports.down = (knex, Promise) => knex.schema
  .dropTableIfExists('users');

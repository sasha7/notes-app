
exports.up = (knex, Promise) => knex.schema
  .createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('username').unique().notNullable();
    table.string('email').unique();
    table.string('password');
    table.string('passwordResetToken');
    table.dateTime('passwordResetExpires');
    table.string('first_name');
    table.string('last_name');
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw('now()'));
  });

exports.down = (knex, Promise) => knex.schema
  .dropTableIfExists('users');

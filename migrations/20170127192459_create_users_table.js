exports.up = (knex, Promise) => knex.schema
  .createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('password');
    table.string('passwordResetToken');
    table.dateTime('passwordResetExpires');
    table.string('first_name');
    table.string('last_name');
    table.string('gender');
    table.string('location');
    table.string('website');
    table.string('picture');
    table.string('facebook');
    table.string('twitter');
    table.string('google');
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw('now()'));
  });

exports.down = (knex, Promise) => knex.schema
  .dropTableIfExists('users');

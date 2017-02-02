// Update with your config settings.
//
const dotenv = require('dotenv');
const PgError = require('pg-error');

dotenv.load();

function emitPgError(err) {
  switch (err.severity) {
    case 'ERROR':
    case 'FATAL':
    case 'PANIC':
      return this.emit('error', err);
    default:
      return this.emit('notice', err);
  }
}

module.exports = {
  client: process.env.DB_CLIENT,
  connection: {
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (connection, done) => {
      connection.connection.parseE = PgError.parse;
      connection.connection.parseN = PgError.parse;
      connection.connection.on('PgError', emitPgError);
      done();
    }
  },
  migrations: {
    tableName: 'knex_migrations'
  }
};

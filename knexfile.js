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
    host: process.env.NODE_ENV === 'production' ? 'db' : process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    charset: 'utf8',
    port: 5432
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

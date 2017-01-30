const bcrypt = require('bcryptjs');
const Model = require('objection').Model;
const util = require('util');
const log = require('debug')('notes-app:user-model');
const _ = require('lodash');

const hiddenFields = ['password', 'passwordResetToken', 'passwordResetExpires'];

class User extends Model {


  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'email'],
      properties: {
        id: { type: 'string' },
        password: { type: 'string' },
        email: { type: 'string', format: 'email', maxLength: 30 },
        first_name: { type: 'string', minLength: 1, maxLength: 40 },
        username: { type: 'string', minLength: 2, maxLength: 30 }
      }
    };
  }

  $formatJson(json) {
    json = super.$formatJson(json);
    return _.omit(json, hiddenFields);
  }

  $beforeInsert(queryContext) {
    log(`QUERY CONTEXT USER MODEL UPDT: ${util.inspect(queryContext)}`);

    this.created_at = new Date().toISOString();
    this.password = makeHash(this.password);
  }

  $beforeUpdate(opt, queryContext) {
    log(`QUERY CONTEXT USER MODEL UPDT: ${util.inspect(queryContext)}`);

    this.updated_at = new Date().toISOString();
    this.password = makeHash(this.password);
  }

  static checkPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
}

module.exports = User;

/**
 * Generate a hash based on bcrypt algorithm
 * @param  {[type]} plainText input string
 * @return {[string]}         hashed string
 */
 const makeHash = plainText => bcrypt.hashSync(plainText, bcrypt.genSaltSync(10));

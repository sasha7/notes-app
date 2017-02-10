const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Model = require('objection').Model;
const util = require('util');
const log = require('debug')('notes-app:user-model');
const _ = require('lodash');

const hiddenFields = ['password', 'passwordResetToken', 'passwordResetExpires', 'created_at', 'updated_at'];

class User extends Model {

  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email'],
      properties: {
        id: { type: 'string' },
        password: { type: 'string' },
        passwordResetExpires: { anyOf: [{ type: 'string', format: 'date-time' }, { type: null }] },
        passwordResetToken: { anyOf: [{ type: 'string' }, { type: null }] },
        email: { type: 'string', format: 'email', maxLength: 30 },
        first_name: { type: 'string', minLength: 1, maxLength: 40 },
        last_name: { type: 'string', maxLength: 40 },
        gender: { type: 'string' },
        picture: { type: 'string', maxLength: 100 },
        website: { type: 'string', maxLength: 40 },
        location: { type: 'string', maxLength: 40 },
        facebook: { type: 'string' },
        twitter: { type: 'string' },
        google: { type: 'string' }
      }
    };
  }

  get avatar() {
    return makeGravatar(this.email);
  }

  $formatJson(obj) {
    obj = super.$formatJson(obj);
    obj.avatar = this.avatar;
    return _.omit(obj, hiddenFields);
  }

  $beforeInsert(queryContext) {
    this.created_at = new Date().toISOString();
    if (this.password) {
      this.password = makeHash(this.password);
    }
  }

  $beforeUpdate(opt, queryContext) {
    this.updated_at = new Date().toISOString();
    if (this.password) {
      this.password = makeHash(this.password);
    }
  }

  static checkPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
}

module.exports = User;

/**
 * Generate a hash based on bcrypt algorithm
 * @param  {string} plainText input text string
 * @return {string}           hashed string
 */
const makeHash = (plainText) => {
  if (!plainText) return;
  return bcrypt.hashSync(plainText, bcrypt.genSaltSync(10));
};

/**
 * Generate link for getting Globally Recognized Avatar
 * @param  {string} email
 * @return {string}       http link representing the gravatar
 */
const makeGravatar = (email) => {
  if (!email) {
    // If email is no present, get awesome generated, 8-bit arcade-style pixelated faces
    return 'https://gravatar.com/avatar/?s=200&d=retro';
  }
  const md5 = crypto.createHash('md5').update(email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=200&d=retro`;
};

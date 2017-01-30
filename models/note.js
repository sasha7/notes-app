const Model = require('objection').Model;
const log = require('debug')('notes-app:notes-model');
const util = require('util');

class Note extends Model {

  static get tableName() {
    return 'notes';
  }

  // Optional schema against which the JSON is validated.
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['title', 'body'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string', minLength: 1, maxLength: 100 },
        body: { type: 'string', minLength: 1, maxLength: 50 }
      }
    };
  }

  $beforeInsert(queryContext) {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate(opt, queryContext) {
    this.updated_at = new Date().toISOString();
  }

}

module.exports = Note;

const Model = require('objection').Model;
const log = require('debug')('notes-app:notes-model');
const util = require('util');
const modelEvents = require('./model_events');

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
        title: { type: 'string', minLength: 1, maxLength: 255 },
        body: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    };
  }

  $beforeInsert(queryContext) {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate(opt, queryContext) {
    this.updated_at = new Date().toISOString();
  }

  $afterInsert(queryContext) {
    modelEvents.created('note', this.toJSON());
  }

  $afterUpdate(queryContext) {
    modelEvents.updated('note', this.toJSON());
  }

  $afterDelete(queryContext) {
    modelEvents.deleted('note', this.toJSON());
  }

}

module.exports = Note;
module.exports.events = modelEvents;

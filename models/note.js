const Model = require('objection').Model;

// // ES-6
// class Note extends Model {
//
//   static get tableName() {
//     return 'notes';
//   }
//
//   // Optional schema against which the JSON is validated.
//   static get jsonSchema() {
//     return {
//       type: 'object',
//       required: ['title', 'body'],
//       properties: {
//         id: { type: 'string' },
//         title: { type: 'string', minLength: 1, maxLength: 100 },
//         body: { type: 'string', minLength: 1, maxLength: 50 }
//       }
//     };
//   }
//
// }

// ES5

/**
 * @extends Model
 * @constructor
 */
function Note() {
  Model.apply(this, arguments);
}

Model.extend(Note);

Note.tableName = 'notes';
Note.jsonSchema = {
  type: 'object',
  required: ['title', 'body'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string', minLength: 1, maxLength: 100 },
    body: { type: 'string', minLength: 1, maxLength: 400 }
  }
};

module.exports = Note;

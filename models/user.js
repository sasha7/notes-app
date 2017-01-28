const Model = require('objection').Model;

function User() {
  Model.apply(this, arguments);
}

Model.extend(User);

User.tableName = 'users';

module.exports = User;

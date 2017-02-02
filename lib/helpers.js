const _ = require('lodash');

// Parses unique errors from PostgreSQL
module.exports.parseUniqueViolationError = (err) => {
  if (!err.detail) {
    return null;
  }

  // Parse the failed attribute name and value from the error message.
  let attrs = err.detail.match(/\((.+)\)=/);
  let values = err.detail.match(/=\((.+)\)/);

  if (attrs.length !== 0 && values.length !== 0) {
    attrs = attrs[1].split(', ');
    values = values[1].split(', ');

    const data = _.reduce(_.zipObject(attrs, values), (result, value, attr) => {
      while (attr.indexOf('"') !== -1) {
        attr = attr.replace('"', '');
      }
      result[attr] = `Entity with "${attr}"="${value}" already exists`;
      return result;
    }, {});

    return data;
  }

  return null;
};

// Checks if error is from Postgres
module.exports.isPostgresError = (error) => {
  if (!error) {
    return false;
  }
  // Just check the existence of a bunch of attributes. There doesn't seem to be an easier way.
  return _.every(['severity', 'code', 'detail', 'internalQuery', 'routine'], attr => _.has(error, attr));
};

/**
 * Generate new Error object with message and Http status code
 * @param  {string} message short message
 * @param  {number} code    Http status code
 * @return {Error}          Error object
 */
module.exports.HttpError = (code, message) => {
  const err = new Error(message);
  err.status = code;
  return err;
};

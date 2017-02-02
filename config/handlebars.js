const inc = (value, options) => parseInt(value, 10) + 1;

const ifeq = (a, b, options) => {
  if (a === b) {
    return options.fn(this);
  }
  return options.inverse(this);
};

const toJSON = object => JSON.stringify(object);

const config = {
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: {
    inc,
    ifeq
  }
};

module.exports = config;

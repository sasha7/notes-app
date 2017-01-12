const hbsHelpers = (hbs) => {
  hbs.registerHelper('inc', (value, options) => parseInt(value, 10) + 1);
};

module.exports = hbsHelpers;

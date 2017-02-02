// Display home page
module.exports.index = (req, res, next) => {
  res.render('home', {
    title: 'Home'
  });
};

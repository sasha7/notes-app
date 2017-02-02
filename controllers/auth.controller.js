const passport = require('passport');

const loginGet = (req, res, next) => {
  res.render('account/login', {
    layout: 'account',
    title: 'Login',
    error: req.flash('error'),
    info: req.flash('info')
  });
};

const loginPost = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/notes',
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password.'
  })(req, res, next);
};

const logoutGet = (req, res, next) => {
  req.logout();
  res.redirect('/');
};

const AuthController = {
  loginGet,
  loginPost,
  logoutGet
};

module.exports = AuthController;

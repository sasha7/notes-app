const passport = require('passport');
const sanitizerConfig = require('../config/sanitizer');
const emailSanitizerConfig = sanitizerConfig.email;

const loginGet = (req, res, next) => {
  const oldUsername = req.session.oldUsername || '';
  delete req.session.oldUsername;
  res.render('account/login', {
    layout: 'full',
    title: 'Login',
    oldUsername
  });
};

const loginPost = (req, res, next) => {
  req.session.oldUsername = req.body.email || undefined;

  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail(emailSanitizerConfig);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      req.flash('errors', result.array());
      return res.redirect('/login');
    }

    passport.authenticate('local', {
      successReturnToOrRedirect: '/',
      failureRedirect: '/login',
      failureFlash: 'Invalid username or password.'
    })(req, res, next);
  });
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

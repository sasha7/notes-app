const passport = require('passport');
const sanitizerConfig = require('../config/sanitizer');
const emailSanitizerConfig = sanitizerConfig.email;
const User = require('../models/user');
const util = require('util');
const log = require('debug')('notes-app:account-controller');
const error = require('debug')('notes-app:error');

const loginGet = (req, res, next) => {
  const previousLoginAttempt = req.session.previousLoginAttempt || '';
  delete req.session.previousLoginAttempt;
  res.render('account/login', {
    layout: 'full',
    title: 'Login',
    background: 'green',
    previousLoginAttempt
  });
};

const loginPost = (req, res, next) => {
  // Save username (email) to session so it can be shown on login page as previous attempt.
  req.session.previousLoginAttempt = req.body.email || undefined;

  // Validate body request data.
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail(emailSanitizerConfig);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      // There are validation errors, redirect to login page with error notification.
      const errors = result.array();
      req.flash('errors', errors);
      return res.redirect('/login');
    }
    // There are no validation errors, proceed to authentication.
    passport.authenticate('local', {
      successReturnToOrRedirect: '/',
      failureRedirect: '/login',
      failureFlash: 'Username or password is not valid. Please try again.'
    })(req, res, next);
  });
};

const logoutGet = (req, res, next) => {
  req.logout();
  res.redirect('/');
};

const profileGet = (req, res, next) => {
  if (!req.user) {
    res.logout();
    res.redirect('/login');
  }
  User.query().findById(req.user.id)
    .then((user) => {
      res.render('account/profile', { user });
    })
    .catch(next);
};

const profilePut = (req, res, next) => {
  const id = req.user.id;

  req.assert('first_name', 'First name must not be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank.').notEmpty();
  req.sanitize('email').normalizeEmail(emailSanitizerConfig);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      const errors = result.array();
      req.flash('errors', errors);
      return res.redirect('/profile');
    }
    User.query()
      .patch({
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        gender: req.body.gender,
        location: req.body.location,
        website: req.body.website
      })
      .where('id', id)
      .then((numOfAffectedRows) => {
        req.flash('success', { msg: 'Your profile information has been updated.' });
        res.redirect('/profile');
      })
      .catch((err) => {
        req.flash('errors', { msg: err.detail || err.message });
        res.redirect('/profile');
      });
  });
};

const changePassword = (req, res, next) => {
  const id = req.user.id;

  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('password_confirm', 'Passwords must match').equals(req.body.password);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      const errors = result.array();
      req.flash('errors', errors);
      return res.redirect('/profile');
    }
    User.query()
      .patch({ password: req.body.password })
      .where('id', id)
      .then((numOfAffectedRows) => {
        req.flash('success', { msg: 'Your password has been changed.' });
        res.redirect('/profile');
      })
      .catch(next);
  });
};

const profileDelete = (req, res, next) => {
  const id = req.user.id;
  User.query()
    .deleteById(id)
    .then((numOfDeletedRows) => {
      req.logout();
      req.flash('info', { msg: 'Your account has been permanetly deleted.' });
      res.redirect('/login');
    })
    .catch(next);
};

const signupGet = (req, res, next) => {
  const previousSignupAttempt = req.session.previousSignupAttempt;
  delete req.session.previousSignupAttempt;
  res.render('account/signup', { layout: 'full', title: 'Signup', background: 'belize', previousSignupAttempt });
};

const signupPost = (req, res, next) => {
  // Save singup info to session so we can be show previous data on failed attempts.
  req.session.previousSignupAttempt = {
    email: req.body.email,
  } || {};

  req.assert('email', 'Email is not valid.').isEmail();
  req.assert('email', 'Email cannot be blank.').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('password_confirm', 'Passwords mush match.').equals(req.body.password);
  req.sanitize('email').normalizeEmail(emailSanitizerConfig);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      const errors = result.array();
      req.flash('errors', errors);
      return res.redirect('/signup');
    }

    User.query()
      .insertAndFetch({ email: req.body.email, password: req.body.password })
      .then((user) => {
        req.logIn(user, (err) => {
          res.redirect('/');
        });
      })
      .catch((err) => {
        if (err.code === '23505') {
          req.flash('errors', { msg: 'The email address you have entered is already associated with another account.' });
          res.redirect('/signup');
        } else {
          next(err);
        }
      });
  });
};

const AccountController = {
  loginGet,
  loginPost,
  logoutGet,
  signupGet,
  signupPost,
  profileGet,
  profilePut,
  profileDelete,
  changePassword
};

module.exports = AccountController;

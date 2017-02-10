const passport = require('passport');
const sanitizerConfig = require('../config/sanitizer');
const emailSanitizerConfig = sanitizerConfig.email;
const User = require('../models/user');
const util = require('util');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const log = require('debug')('notes-app:account-controller');
const error = require('debug')('notes-app:error');
const _ = require('lodash');
const Promise = require('bluebird');

const mailGunConfig = {
  service: 'Mailgun',
  auth: {
    user: process.env.MAILGUN_USERNAME,
    pass: process.env.MAILGUN_PASSWORD
  }
};

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
  req.session.previousSignupAttempt = { email: req.body.email } || {};

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

// Unlink OAuth provider
const unlinkProvider = (req, res, next) => {
  const provider = req.params.provider;
  const validProviders = ['facebook'];

  // check if provider is valid
  if (!_.isEmpty(provider) && _.indexOf(validProviders, provider) === -1) {
    req.flash('error', { msg: 'Invalid OAuth Provider' });
    return res.redirect('/profile');
  }

  const data = {};
  data[provider] = '';
  data.picture = '';

  User.query()
    .patchAndFetchById(req.user.id, data)
    .then((user) => {
      req.flash('success', { msg: `Your ${provider} account has been unlinked.` });
      return res.redirect('/profile');
    })
    .catch(next);
};

const forgotGet = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password',
  });
};

const forgotPost = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail(emailSanitizerConfig);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      const errors = result.array();
      req.flash('errors', errors);
      return res.redirect('/forgot');
    }

    const email = req.body.email;

    _findUserByEmail(email)
      .then(_setPasswordResetToken)
      .then(data => _sendEmailResetPassword(data.token, data.user, req.headers.host))
      .then((user) => {
        req.flash('info', { msg: `An email has been sent to ${user.email} with further instructions.` });
        res.redirect('/forgot');
      })
      .catch(Error, (err) => {
        if (err.message === 'User not found') {
          req.flash('errors', { msg: `The email address ${email} is not associated with any account.` });
          res.redirect('/forgot');
        } else {
          return Promise.reject(err);
        }
      })
      .catch(next);
  });
};

const resetGet = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  User.query()
    .where('passwordResetToken', req.params.token)
    .where('passwordResetExpires', '>', new Date())
    .first()
    .then((user) => {
      if (!user) {
        req.flash('error', {
          msg: 'Password reset token is invalid or has expired.'
        });
        res.redirect('/forgot');
      } else {
        res.render('account/reset', {
          title: 'Password Reset'
        });
      }
    });
};

const resetPost = (req, res, next) => {
  // Validation rules
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirm', 'Passwords must match').equals(req.body.password);

  // Validate body input fields
  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      const errors = result.array();
      req.flash('errors', errors);
      res.redirect('back');
    } else {
      // find user by token, reset password, reset token, login user and send email notification.
      _findUserByPasswordResetToken(req.params.token)
        .then(user => _updatePasswordAndResetToken(user, req.body.password))
        .then(_sendEmailPasswordChanged)
        .then((user) => {
          req.logIn(user, (err) => {
            req.flash('success', { msg: 'Your password has been changed successfully.' });
            res.redirect('/profile');
          });
        })
        .catch(Error, (err) => {
          if (err.message === 'Reset token not found or invalid') {
            req.flash('error', { msg: 'Password reset token is invalid or has expired.' });
            res.redirect('back');
          } else {
            return Promise.reject(err);
          }
        })
        .catch(next);
    }
  });
};

const _findUserByEmail = email => User.query()
  .where('email', email)
  .first()
  .then((user) => {
    if (!user) {
      return Promise.reject(new Error('User not found'));
    }
    return Promise.resolve(user);
  });

const _setPasswordResetToken = (user) => {
  const token = crypto.randomBytes(16).toString('hex');
  const expires = (new Date(Date.now() + 3600000)).toISOString();
  return user.$query()
    .patch({ passwordResetToken: token, passwordResetExpires: expires })
    .then(() => Promise.resolve({ token, user }));
};

const _findUserByPasswordResetToken = token => User.query()
  .where('passwordResetToken', token)
  .where('passwordResetExpires', '>', new Date())
  .first()
  .then((user) => {
    if (!user) {
      return Promise.reject(new Error('Reset token not found or invalid'));
    }
    return Promise.resolve(user);
  });

const _updatePasswordAndResetToken = (user, password) => user.$query()
  .patch({ password, passwordResetToken: null, passwordResetExpires: null })
  .then(() => Promise.resolve(user));

const _sendEmailPasswordChanged = (user) => {
  const transporter = nodemailer.createTransport(mailGunConfig);

  const mailOptions = {
    from: 'support@yourdomain.com',
    to: user.email,
    subject: '✔ Your NotesApp password has been changed',
    text: `
      Hello ${user.first_name},\n\n
      This is a confirmation that the password for your account ${user.email} has just been changed.\n
    `
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err) => {
      if (err) reject(err);
      resolve(user);
    });
  });
};

const _sendEmailResetPassword = (token, user, host) => {
  const transporter = nodemailer.createTransport(mailGunConfig);

  const mailOptions = {
    from: 'support@yourdomain.com',
    to: user.email,
    subject: '✔ Reset your password on NotesApp',
    text: `
      You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      http://${host}/reset/${token}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n
    `
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err) => {
      if (err) reject(err);
      resolve(user);
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
  changePassword,
  unlinkProvider,
  forgotGet,
  forgotPost,
  resetGet,
  resetPost
};

module.exports = AccountController;

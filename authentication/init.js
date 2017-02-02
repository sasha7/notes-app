const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/user');
const authenticationMiddleware = require('./middleware');
const util = require('util');
const log = require('debug')('notes-app:auth');
const error = require('debug')('notes-app:error');

// Encoding and decoding authentication data for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((userId, done) => {
  User.query()
    .findById(userId)
    .then(user => done(null, user));
});

const initPassport = () => {
  // Set local authentication strategy
  passport.use('local',
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password'
      },
      (username, password, done) => {
        User.query()
          .where('username', username)
          .first()
          .then((user) => {
            if (!user) {
              return done(null, false, { message: 'User does not exist!' });
            }

            if (!User.checkPassword(password, user.password)) {
              return done(null, false, { message: 'Password is incorrect!' });
            }

            return done(null, user);
          })
          .catch(done);
      }
    )
  );
};

module.exports = initPassport;

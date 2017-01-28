const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/user');
const authenticationMiddleware = require('./middleware');
const log = require('debug')('notes-app:auth');

// Encoding and decoding authentication data for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((userId, done) => {
  User.query()
    .findById(userId)
    .then(user => done(null, user))
    .catch(done);
});

const initPassport = () => {
  // Set local authentication strategy
  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
    (username, password, done) => {
      User.query()
        .where('username', username)
        .first()
        .then((user) => {
          log('AUTH USR: ', user);
          if (!user) {
            return done(null, false, { message: 'User does not exist!' });
          }

          // implement as a method inside User model
          if (password === user.password) {
            done(null, user);
          } else {
            done(null, false, { message: 'Password is incorrect!' });
          }
        })
        .catch(done);
    }
  ));
};

module.exports = initPassport;

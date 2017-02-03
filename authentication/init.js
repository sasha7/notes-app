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
    new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true },
      (req, email, password, done) => {
        User.query()
          .where('email', email)
          .first()
          .then((user) => {
            if (!user) {
              return done(null, false, { message: 'Invalid username or password' });
            }
            if (!User.checkPassword(password, user.password)) {
              return done(null, false, { message: 'Invalid username or password' });
            }
            delete req.session.oldUsername;
            return done(null, user, { message: 'Invalid username or password' });
          })
          .catch(err => done(null, false, { message: 'Invalid username or password' }));
      }
    )
  );
};

module.exports = initPassport;

/* eslint-disable no-shadow,indent */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');
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
    .then(user => done(null, user))
    .catch(err => done(err, null));
});

const initPassport = () => {
  // Local Strategy: Login using email and password.
  passport.use('local',
    new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true },
      (req, email, password, done) => {
        const LOGIN_FAILED_MESSAGE = 'Invalid username or password';
        User.query()
          .where('email', email)
          .first()
          .then((user) => {
            if (!user) {
              return done(null, false, { message: LOGIN_FAILED_MESSAGE });
            }
            if (!User.checkPassword(password, user.password)) {
              return done(null, false, { message: LOGIN_FAILED_MESSAGE });
            }
            delete req.session.previousLoginAttempt;
            return done(null, user, { message: LOGIN_FAILED_MESSAGE });
          })
          .catch(err => done(null, false, { message: LOGIN_FAILED_MESSAGE }));
      }
    )
  );

  // Login using Facebook
  passport.use(
    new FacebookStrategy({
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['name', 'email', 'gender', 'location'],
        passReqToCallback: true,
        enableProof: true // prevent use of tokens stolen by evil users
      },
      (req, accessToken, refreshToken, profile, done) => {
        // User is already logged in, just link his Facebook account.
        if (req.user) {
          // Check if Facebook is already linked to some account.
          User.query()
            .where('facebook', profile.id)
            .first()
            .then((user) => {
              if (user) {
                req.flash('errors', { msg: 'There is already an existing account linked with Facebook that belongs to you.' });
                done(null);
              } else {
                // Link facebook account to currently logged in user.
                const loggedInUser = req.user;
                const data = {
                  first_name: loggedInUser.first_name || profile.name.givenName,
                  last_name: loggedInUser.last_name || profile.name.familyName,
                  gender: loggedInUser.gender || profile._json.gender,
                  picture: loggedInUser.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`,
                  facebook: profile.id
                };

                User.query()
                  .patchAndFetchById(loggedInUser.id, data)
                  .then((user) => {
                    req.flash('success', { msg: 'Your Facebook account has been linked.' });
                    done(null, user);
                  })
                  .catch((err) => {
                    error(err);
                    return done(null);
                  });
              }
            })
            .catch((err) => {
              error(err);
              return done(null);
            });
        } else {
          // User is not logged in, Try to find by existing `facebook` profile id.
          User.query()
            .where('facebook', profile.id)
            .first()
            .then((user) => {
              if (user) {
                // Put user info to session.
                done(null, user);
              } else {
              // User does not exist, check if email is already taken.
              User.query()
                .where('email', profile._json.email)
                .first()
                .then((user) => {
                  // Email is already taken, don't create new user account, just update existing.
                  if (user) {
                    const data = {
                      first_name: user.first_name || profile.name.givenName,
                      last_name: user.last_name || profile.name.familyName,
                      gender: user.gender || profile._json.gender,
                      picture: user.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`,
                      facebook: profile.id
                    };

                    User.query()
                      .patchAndFetchById(user.id, data)
                      .then((user) => {
                        req.flash('success', { msg: 'Your Facebook account has been linked.' });
                        done(null, user);
                      })
                      .catch((err) => {
                        error(err);
                        done(null);
                      });
                  } else {
                    // Email is not taken, create new account.
                    const data = {
                      first_name: profile.name.givenName,
                      last_name: profile.name.familyName,
                      email: profile._json.email,
                      gender: profile._json.gender,
                      location: profile._json.location && profile._json.location.name,
                      picture: `https://graph.facebook.com/${profile.id}/picture?type=large`,
                      facebook: profile.id
                    };

                    User.query()
                      .insert(data)
                      .then(user => done(null, user))
                      .catch((err) => {
                        error(err);
                        done(null);
                      });
                  }
                })
                .catch((err) => {
                  error(err);
                  done(null);
                });
              }
            })
            .catch((err) => {
              error(err);
              done(null);
            });
        }
      }
    )
  );
};

module.exports = initPassport;

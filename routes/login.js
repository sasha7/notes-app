const express = require('express');
const log = require('debug')('notes-app:log');
const passport = require('passport');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('login', { message: req.flash('error') });
});

router.post('/',
  passport.authenticate('local', {
    successRedirect: '/notes',
    failureRedirect: '/login',
    failureFlash: true
  })
);

module.exports = router;

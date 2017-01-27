const express = require('express');
const log = require('debug')('notes-app:log');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('login');
});

router.post('/attempt', (req, res, next) => {
  log('req body data: ', req.body);
  res.redirect('/');
});

module.exports = router;

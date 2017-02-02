const express = require('express');
const path = require('path');
const util = require('util');
const log = require('debug')('notes-app:router-home');
const error = require('debug')('notes-app:error');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Home',
    breadcrumbs: [{ href: '/', text: 'Home' }]
  });
});

module.exports = router;

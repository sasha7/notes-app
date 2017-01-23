const express = require('express');
const path = require('path');
const util = require('util');
const log = require('debug')('notes-app:router-notes');
const error = require('debug')('notes-app:error');
const Note = require('../models').Note;

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  // Gather data about the notes that will be displayed on home page
  Note.findAll()
    .then((notes) => {
      res.render('index', {
        title: 'Notes',
        notes,
        breadcrumbs: [
          {
            href: '/',
            text: 'Home'
          }
        ]
      });

      util.log('notes', util.inspect(notes));
    })
    .catch(err => next(err));
});

module.exports = router;

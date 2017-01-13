const express = require('express');
const notes = require('../models/notes-fs');
const util = require('util');
const log = require('debug')('notes-app:router-notes');
const error = require('debug')('notes-app:error');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  // Gather data about the notes that will be displayed on home page
  notes.keylist()
    .then((keylist) => {
      const keyPromises = [];

      for (let i = 0; i < keylist.length; i += 1) {
        const key = keylist[i];
        keyPromises.push(
          notes.read(key)
            .then(note => ({
              key: note.key,
              title: note.title
            }))
        );
      }
      // Promise.all([pr1. pr2, pr3,...]) executes an array of Promises.
      // Result is an array containing the result of each Promise.
      // If any Promise in the array fails, execution jumps to .catch block.
      return Promise.all(keyPromises);
    })
    .then((notelist) => {
      res.render('index', {
        title: 'Notes',
        notelist,
        breadcrumbs: [
          {
            href: '/',
            text: 'Home'
          }
        ]
      });

      util.log('notes', util.inspect(notelist));
    })
    .catch(error => next(error));
});

module.exports = router;

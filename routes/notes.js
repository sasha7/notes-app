const express = require('express');
const util = require('util');
const notes = require('../models/notes-memory');

const router = express.Router();

const errorHelper = (msg, next) => {
  const err = new Error(msg);
  err.status = 404;
  next(err);
};

router.get('/view', (req, res, next) => {
  const key = req.query.key;
  if (key) {
    notes.read(key)
      .then(note => res.render('notesview', { title: `Note ${note.key}`, note }))
      .catch(err => next(err));
  } else {
    errorHelper('Value for query param \'key\' is missing in the URL.', next);
  }
});

router.get('/add', (req, res, next) => {
  res.render('notesedit', {
    title: 'Add a note',
    create: 1,
    key: '',
    note: {
      body: '',
      title: ''
    }
  });
});

router.get('/edit', (req, res, next) => {
  const key = req.query.key;
  if (key) {
    notes.read(key)
      .then(note => res.render('notesedit', {
        title: 'Edit note',
        create: 0,
        key,
        note
      }))
    .catch(err => next(err));
  } else {
    errorHelper('Value for query param \'key\' is missing in the URL.', next);
  }
});

router.get('/destroy', (req, res, next) => {
  const key = req.query.key;
  if (key) {
    notes.read(key)
      .then((note) => {
        res.render('notesdelete', {
          title: note.title,
          key,
          note
        });
      })
      .catch(err => next(err));
  } else {
    errorHelper('Value for query param \'key\' is missing in the URL.', next);
  }
});

router.post('/destroy/confirm', (req, res, next) => {
  const key = req.body.key;
  if (key) {
    notes.destroy(key)
      .then(() => res.redirect('/'))
      .catch(err => next(err));
  } else {
    errorHelper('Value for query param \'key\' is missing in the URL.', next);
  }
});


router.post('/save', (req, res, next) => {
  let promise;
  util.log(`note: ${util.inspect(req.body)}`);
  if (req.body.create) {
    promise = notes.create(req.body.key, req.body.title, req.body.body);
  } else {
    promise = notes.update(req.body.key, req.body.title, req.body.body);
  }

  promise
    .then(note => res.redirect(`/notes/view/?key=${note.key}`))
    .catch(err => next(err));
});

module.exports = router;

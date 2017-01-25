const express = require('express');
const path = require('path');
const log = require('debug')('notes-app:router-notes');
const error = require('debug')('notes-app:error');
const Note = require('../models/note');
const util = require('util');

const router = express.Router();

const errorHelper = (msg, next) => {
  const err = new Error(msg);
  err.status = 404;
  next(err);
};

router.get('/view', (req, res, next) => {
  const id = req.query.id;
  if (id) {
    Note.query()
      .findById(id)
      .then(note => res.render('notesview', {
        title: `Note ${note.id}`,
        note,
        breadcrumbs: [
          {
            href: '/',
            text: 'Home'
          },
          {
            active: true,
            text: note.title
          }
        ]
      }))
      .catch(next);
  } else {
    errorHelper('Value for query param \'id\' is missing in the URL.', next);
  }
});

router.get('/add', (req, res, next) => {
  res.render('notesedit', {
    title: 'Add a note',
    create: 1,
    note: {
      body: '',
      title: ''
    },
    breadcrumbs: [
      {
        href: '/',
        text: 'Home'
      },
      {
        active: true,
        text: 'Add Note'
      }
    ]
  });
});

router.get('/edit', (req, res, next) => {
  const id = req.query.id;
  if (id) {
    Note.query()
      .findById(id)
      .then(note => res.render('notesedit', {
        title: 'Edit Note',
        create: 0,
        id: note.id,
        note,
        breadcrumbs: [
          {
            href: '/',
            text: 'Home'
          },
          {
            active: true,
            text: `Edit Note ${note.title}`
          }
        ]
      }))
      .catch(next);
  } else {
    errorHelper('Value for query param \'id\' is missing in the URL.', next);
  }
});

router.get('/destroy', (req, res, next) => {
  const id = req.query.id;
  if (id) {
    Note.query()
      .findById(id)
      .then((note) => {
        res.render('notesdelete', {
          title: note.title,
          id: note.id,
          note,
          breadcrumbs: [
            {
              href: '/',
              text: 'Home'
            },
            {
              active: true,
              text: 'Delete Note'
            }
          ]
        });
      })
      .catch(next);
  } else {
    errorHelper('Value for query param \'id\' is missing in the URL.', next);
  }
});

router.post('/destroy/confirm', (req, res, next) => {
  const id = req.body.id;
  if (id) {
    Note.query()
      .deleteById(id)
      .then(() => res.redirect('/'))
      .catch(next);
  } else {
    errorHelper('Value for query param \'id\' is missing in the URL.', next);
  }
});

router.post('/save', (req, res, next) => {
  if (parseInt(req.body.create, 10)) {
    const body = req.body;
    Note.query()
      .insertAndFetch(body)
      .then((note) => {
        log(`MODEL UPDATE ${util.inspect(note)}`);
        res.redirect(`/notes/view/?id=${note.id}`);
      })
      .catch(err => next(err));
  } else {
    const id = req.body.id;
    const noteUpdate = { title: req.body.title, body: req.body.body };
    Note.query()
      .patchAndFetchById(id, noteUpdate)
      .then((note) => {
        log(`MODEL UPDATE ${util.inspect(note)}`);
        res.redirect(`/notes/view/?id=${note.id}`);
      })
      .catch(next);
  }
});

module.exports = router;

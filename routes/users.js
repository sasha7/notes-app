const express = require('express');
const router = express.Router();
const User = require('../models/user');
const util = require('util');
const log = require('debug')('notes-app:user-model');
const error = require('debug')('notes-app:error');


// GET users listing
router.get('/', (req, res, next) => {
  User.query()
    .then((users) => {
      res.status(200).json(users);
    })
    .catch(next);
});

// Get a single user
router.get('/:id', (req, res, next) => {
  User.query()
    .findById(req.params.id)
    .then(user => res.status(200).json(user))
    .catch(next);
});
// Create new user
router.post('/', (req, res, next) => {
  const data = req.body;
  log('CREATING NEW USER with ', data);

  if (data) {
    User.query()
      .insert(data)
      .then((user) => {
        log(`CREATED USER ${util.inspect(user)}`);
        res.status(200).json(user);
      })
      .catch(next);
  }
});

// Update user
router.patch('/:id', (req, res, next) => {
  log(`UPDATING USER ${req.params.id}`);
  const data = req.body;
  if (data) {
    User.query()
      .patchAndFetchById(req.params.id, data)
      .then((user) => {
        log(`UPDATED USER ${util.inspect(user)}`);
        res.status(200).json(user);
      })
      .catch(next);
  }
});

module.exports = router;

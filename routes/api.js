// Routes: Note API resource - CRUD
// Defined routes which associate URLs with controller actions.

// RequestType   Path                           Action
// ===================================================================
// GET           /notes                         index
// POST          /notes                         store
// GET           /notes/{note}                  show
// PUT/PATCH     /notes/{note}                  update
// DELETE        /notes/{note}                  destroy

const express = require('express');
const router = express.Router();
const noteApiController = require('../controllers/noteApi.controller');

router.get('/notes/', noteApiController.index);
router.post('/notes/', noteApiController.store);
router.get('/notes/:id', noteApiController.show);
router.put('/notes/:id', noteApiController.update);
router.patch('/notes/:id', noteApiController.update);
router.delete('/notes/:id', noteApiController.destroy);

module.exports = router;

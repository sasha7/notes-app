/**
 * API Routes
 * @url /api/v1/[resource]
 */

// Notes
// RequestType   Path                           Action
// ===================================================================
// GET           /notes                         index
// POST          /notes                         store
// GET           /notes/{note}                  show
// PUT/PATCH     /notes/{note}                  update
// DELETE        /notes/{note}                  destroy
//
// Users
// RequestType   Path                           Action
// ===================================================================
// GET           /users                         index
// POST          /users                         store
// GET           /users/{note}                  show
// PUT/PATCH     /users/{note}                  update
// DELETE        /users/{note}                  destroy

const express = require('express');
const router = express.Router();
const noteApiController = require('../controllers/noteApi.controller');
const userApiController = require('../controllers/userApi.controller');

router.get('/notes', noteApiController.index);
router.post('/notes', noteApiController.store);
router.get('/notes/:id', noteApiController.show);
router.put('/notes/:id', noteApiController.update);
router.patch('/notes/:id', noteApiController.update);
router.delete('/notes/:id', noteApiController.destroy);

router.get('/users', userApiController.index);
router.post('/users', userApiController.store);
router.get('/users/:id', userApiController.show);
router.put('/users/:id', userApiController.update);
router.patch('/users/:id', userApiController.update);
router.delete('/users/:id', userApiController.destroy);

module.exports = router;

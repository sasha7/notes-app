// Routes: Note resource - CRUD
// Defined routes which associate URLs with controller actions.

// RequestType   Path                           Action
// ===================================================================
// GET           /notes                         noteController.index
// GET           /notes/create                  noteController.create
// POST          /notes/store                   noteController.store
// GET           /notes/{note}                  noteController.show
// GET           /notes/{note}/edit             noteController.edit
// PUT/PATCH     /notes/{note}                  noteController.update
// GET           /notes/{note}/confirm-destroy  noteController.confirm
// DELETE        /notes/{note}                  noteController.destroy

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');

router.get('/', noteController.index);
router.get('/create', noteController.create);
router.post('/store', noteController.store);
router.get('/:id', noteController.show);
router.get('/:id/edit', noteController.edit);
router.put('/:id', noteController.update);
router.patch('/:id', noteController.update);
router.get('/:id/confirm-destroy', noteController.showConfirmDestroy);
router.delete('/:id', noteController.destroy);

module.exports = router;
module.exports.socketio = noteController.registerSocketio;

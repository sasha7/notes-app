const Note = require('../models/note');
const HttpError = require('../lib/helpers').HttpError;
const error = require('debug')('notes-app:note-controller-error');

/**
 * Display a listing of the resource.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const index = (req, res, next) => {
  Note.query()
    .then((notes) => {
      res.render('notes/index', {
        title: 'Notes',
        notes
      });
    })
    .catch(next);
};

/**
 * Display the specified resource.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const show = (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    next(HttpError(400, 'Missing param: \'id\''));
  }

  Note.query()
    .findById(id)
    .then(note => res.render('notes/show', {
      title: 'Note',
      note
    }))
    .catch(next);
};

/**
 * Show the form for creating a specified resource.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const create = (req, res, next) => {
  res.render('notes/create', {
    title: 'Create Note'
  });
};

/**
 * Show the form for editing the specified resource.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const edit = (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    next(HttpError(400, 'Missing param: \'id\''));
  }

  Note.query()
    .findById(id)
    .then(note => res.render('notes/edit', {
      title: 'Edit Note',
      id: note.id,
      note
    }))
    .catch(next);
};

/**
 * Store a newly created resource in storage.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const store = (req, res, next) => {
  const body = req.body;
  Note.query()
    .insertAndFetch({ title: req.body.title, body: req.body.body })
    .then((note) => {
      res.redirect(`/notes/${note.id}`);
    })
    .catch(next);
};

/**
 * Update the specified resource in storage.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const update = (req, res, next) => {
  const id = req.params.id;
  const obj = { title: req.body.title, body: req.body.body };

  Note.query()
    .patchAndFetchById(id, obj)
    .then((note) => {
      res.redirect(`/notes/${note.id}`);
    })
    .catch(next);
};

/**
 * Show confirm page for deleting the resource.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const showConfirmDestroy = (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    next(HttpError(400, 'Missing param: \'id\''));
  }

  Note.query()
    .findById(id)
    .then((note) => {
      res.render('notes/delete', {
        title: `Delete Note - ${note.title}`,
        id: note.id,
        note,
      });
    })
    .catch(next);
};

/**
 * Remove the specified resource from storage.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const destroy = (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    next(HttpError(400, 'Missing param: \'id\''));
  }

  Note.query()
    .findById(id)
    .then((note) => {
      const noteTitle = note.title;
      note.$query()
        .delete()
        .then((numOfDeletedRows) => {
          req.flash('info', { msg: `Note ${noteTitle} was deleted successfuly.` });
          res.redirect('/notes');
        })
        .catch(next);
    })
    .catch(next);
};

const registerSocketio = (io) => {
  const getAndEmitNotes = () => {
    Note.query()
      .select('id', 'title')
      .then((notes) => {
        io.of('/notes').emit('refresh-list', { list: notes });
      })
      .catch(error);
  };

  // Connect Model EventEmitter with Socket.io
  Note.events.on('note:created', getAndEmitNotes);
  Note.events.on('note:updated', getAndEmitNotes);
  Note.events.on('note:deleted', getAndEmitNotes);
};

// Controller with all of the typical CRUD actions.
const NoteController = {
  index,
  show,
  create,
  store,
  edit,
  update,
  showConfirmDestroy,
  destroy,
  registerSocketio
};

module.exports = NoteController;

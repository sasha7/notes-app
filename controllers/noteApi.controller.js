const Note = require('../models/note');
const HttpError = require('../lib/helpers').HttpError;

/**
 * Display a listing of the resource.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const index = (req, res, next) => {
  Note.query()
    .then((notes) => {
      res.json(notes);
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
    .then(note => res.json(note))
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
    .insertAndFetch(body)
    .then(note => res.json(note))
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
    .then(note => res.json(note))
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
    .deleteById(id)
    .then(res.json({}))
    .catch(next);
};

// Controller with all of the typical CRUD actions.
const NoteApiController = {
  index,
  show,
  store,
  update,
  destroy
};

module.exports = NoteApiController;

const User = require('../models/user');
const HttpError = require('../lib/helpers').HttpError;

/**
 * Display a listing of the resource.
 * @param  {Request}      req  Http request
 * @param  {Response}     res  Http response
 * @param  {NextFunction} next Next handler
 */
const index = (req, res, next) => {
  User.query()
    .then((users) => {
      res.json(users);
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

  User.query()
    .findById(id)
    .then(user => res.json(user))
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
  User.query()
    .insertAndFetch(body)
    .then(user => res.json(user))
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
  const data = req.body;

  User.query()
    .patchAndFetchById(id, data)
    .then(user => res.json(user))
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

  User.query()
    .deleteById(id)
    .then(res.json({}))
    .catch(next);
};

// Controller with all of the typical CRUD actions.
const UserApiController = {
  index,
  show,
  store,
  update,
  destroy
};

module.exports = UserApiController;

/**
 * Ensures that a user is authenticated before proceeding to next router middleware.
 *
 * If a request is received that is unauthenticated, the request will be redirected
 * to a login page (by default to `/login`).
 *
 * Additionally, `returnTo` will be set in the session to the URL of the current url.
 * After authentication this value can be used to redirect the user to the page that was
 * originaly requested.
 *
 * By default when a user is redirected to a login page, he will see a message asking him to log in.
 * This message can be set by adding `flashMessage` in options. It is then accessible
 * inside your template locals as `messages.info`
 *
 * Examples:
 *
 *     app.get('/profile',
 *       ensureAuthenticatedUsingRedirect(),
 *       function(req, res) { ... });
 *
 *     app.get('/profile',
 *       ensureAuthenticatedUsingRedirect('/signin'),
 *       function(req, res) { ... });
 *
 *     app.get('/profile',
 *       ensureAuthenticatedUsingRedirect({ redirectTo: '/session/new', setReturnTo: false }),
 *       function(req, res) { ... });
 *
 * Options
 *   -  `redirectTo`   String    URL to redirect to login (default: `/login`)
 *   -  `setReturnTo`  Boolean   set returnTo in session (default: true)
 *   -  `flashMessage` String    message
 *
 * @param  {Object} options
 * @return {Function}
 */
const ensureAuthenticatedRedirect = (options) => {
  const DEFAULT_REDIRECT_TO = '/login';
  const DEFAULT_FLASH = 'Please log in.';

  // sets redirectTo
  if (typeof options === 'string') {
    options = { redirectTo: options };
  }

  options = options || {};

  const url = options.redirectTo || DEFAULT_REDIRECT_TO;
  const setReturnTo = (options.setReturnTo === undefined) ? true : options.setReturnTo;
  const flashMessage = (options.flashMessage === undefined) ? DEFAULT_FLASH : options.flashMessage;

  return (req, res, next) => {
    // check if a user is authenticated
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('info', { msg: flashMessage });
      if (setReturnTo && req.session) {
        req.session.returnTo = req.originalUrl || req.url;
      }
      res.redirect(url);
    }
  };
};

/**
 * Ensures that a user is authenticated before proceeding to next router middleware.
 *
 * If a request is received that is unauthenticated, it will generate a JSON response with a
 * 401 Unauthorized HTTP header status.
 *
 *
 * Examples:
 *
 *     app.get('/api/v1/notes',
 *       ensureAuthenticatedJSON(),
 *       function(req, res) { ... });
 *
 *
 * @return {Function}
 */
const ensureAuthenticatedJSON = () => {
  const MESSAGE_401 = 'Not authorized.';

  return (req, res, next) => {
    // check if a user is authenticated
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({
        success: false,
        message: MESSAGE_401
      });
    }
  };
};

module.exports = {
  ensureAuthenticatedRedirect,
  ensureAuthenticatedJSON
};

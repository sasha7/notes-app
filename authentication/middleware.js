/*
 *  Login Required middleware.
 *
 * Check the request if the user is authenticated.
 * Return an error message if not, otherwise keep going :)
 */
const ensureAuthenticated = (req, res, next) => {
  // isAuthenticated is set by `deserializeUser()`
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    // res.status(401).send({
    //   success: false,
    //   message: 'You need to be authenticated to access this page!'
    // });
    // req.session.returnTo = req.path;
    res.redirect('/login');
  } else {
    next();
  }
};

module.exports = ensureAuthenticated;

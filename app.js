const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const flash = require('express-flash');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressHbs = require('express-handlebars');
const fs = require('fs');
const hbsConfig = require('./config/handlebars');
const error = require('debug')('notes-app:error');
const log = require('debug')('notes-app:main');
const dotenv = require('dotenv');
const Knex = require('knex');
const knexConfig = require('./knexfile');
const Model = require('objection').Model;
const util = require('util');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const authentication = require('./authentication');
const ensureAuthenticatedRedirect = authentication.middleware.ensureAuthenticatedRedirect;
const ensureAuthenticatedJSON = authentication.middleware.ensureAuthenticatedJSON;
const expressValidator = require('express-validator');
const helpers = require('./lib/helpers');
const parseUniqueViolationError = helpers.parseUniqueViolationError;
const isPostgresError = helpers.isPostgresError;
const methodOverride = require('method-override');
const PgError = require('pg-error');

// Controllers
const homeController = require('./controllers/home.controller');
const accountController = require('./controllers/account.controller');

// Routes
const notesRoutes = require('./routes/notes'); // Notes CRUD pages
const apiRoutes = require('./routes/api'); // RESTFul API /api/v1/[resource]

dotenv.load();

const cookieExpirationDate = new Date();
const cookieExpirationDays = 1;
cookieExpirationDate.setDate(cookieExpirationDate.getDate() + cookieExpirationDays);

const knex = Knex(knexConfig);
// Bind all models to a knex instance (for only one database).
// If there is more than one database, use Model.bindKnex method.
Model.knex(knex);

const app = express();

// initialize authentication (Passport strategies)
authentication.init(app);

// create new Handlebars instance and use as a templating engine
const hbs = expressHbs.create(hbsConfig);

// view engine setup
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// disable x-powered-by http header
app.disable('x-powered-by');

// setup logger http requests
if (app.get('env') === 'development') {
  app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev'));
}

app.use(favicon(path.join(__dirname, 'public', 'img/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SECRET_KEY));

// An express.js middleware for node-validator.
app.use(expressValidator());

// Use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.
// IMPORTANT: needs to be used before any module that needs to know the method of the request
app.use(methodOverride('_method')); // override using a query value (ex. ?_method=DELETE).

// Server files in public
app.use(express.static(path.join(__dirname, 'public')));

// Initialize session filestore
app.use(session({
  store: new FileStore({ path: './sessions' }),
  secret: process.env.SECRET_KEY,
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: cookieExpirationDate // use expires instead of maxAge
  }
}));

// Use flash messages
app.use(flash());

// Initialize passport to use sessions
app.use(passport.initialize());
app.use(passport.session());

// If user is authenticated, set local var 'user' used in templates
app.use((req, res, next) => {
  res.locals.user = req.user ? req.user.toJSON() : null;
  next();
});

// Register app routes

// WITHOUT authentication
app.get('/', homeController.index);
app.get('/login', accountController.loginGet);
app.post('/login', accountController.loginPost);
app.get('/logout', accountController.logoutGet);
app.get('/signup', accountController.signupGet);
app.post('/signup', accountController.signupPost);

// WITH authentication
app.get('/profile', ensureAuthenticatedRedirect(), accountController.profileGet);
app.put('/profile', ensureAuthenticatedRedirect(), accountController.profilePut);
app.put('/change_password', ensureAuthenticatedRedirect(), accountController.changePassword);
app.delete('/profile', ensureAuthenticatedRedirect(), accountController.profileDelete);
app.use('/notes', ensureAuthenticatedRedirect(), notesRoutes);
app.use('/api/v1', apiRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// general error handler
app.use((err, req, res, next) => {
  error(`${(err.status || err.statusCode || 500)} ${err.message || err.data || {}}`);

  // Handle validation errors from Objection.js ORM
  if (err.constructor.name === 'ValidationError') {
    error('ORM VALIDATION ERROR');
    res.status(err.statusCode || err.status || 500).json({
      error: {
        code: 'VALIDATION-ERROR',
        http_code: err.statusCode,
        message: err.data || {}
      }
    });
  } else if (err instanceof PgError) {
    // Handle errors from the Postgresql database
    error('PG DB ERROR');
    // Other approach: if (isPostgresError(err)) ..
    // const uniqueViolationErrors = parseUniqueViolationError(err);
    //
    if (req.url.indexOf('api') >= 0) {
      res.status(400).json({
        error: {
          code: 'BAD-REQUEST',
          http_code: 400,
          message: err.detail
        }
      });
    } else {
      res.render('error');
    }
  } else { // Render 500 error as a html page
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);

    if (req.url.indexOf('api') >= 0) {
      res.json({
        error: {
          code: 'NOT-FOUND',
          http_code: err.status || 500,
          message: 'Not Found'
        }
      });
    } else {
      // render the error page
      res.render('error');
    }
    // res.status(err.status || 500);
  }
});

// handle uncaught exceptions - ONLY IN DEVELOPMENT
if (app.get('env') === 'development') {
  process.on('uncaughtException', (err) => {
    error(`App crashed!! - ${(err.stack || err)}`);
  });
}

module.exports = app;

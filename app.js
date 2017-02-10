#!/usr/bin/env node

/**
 * Module dependencies.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const favicon = require('serve-favicon');
const flash = require('express-flash');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressHbs = require('express-handlebars');
const fs = require('fs');
const hbsConfig = require('./config/handlebars');
const logError = require('debug')('notes-app:error');
const log = require('debug')('notes-app:main');
const debug = require('debug')('notes-app:server');
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

const passportSocketIo = require('passport.socketio');

// Controllers
const homeController = require('./controllers/home.controller');
const accountController = require('./controllers/account.controller');
const contactController = require('./controllers//contact.controller');

// Routes
const notesRoutes = require('./routes/notes'); // Notes CRUD pages
const apiRoutes = require('./routes/api'); // RESTFul API /api/v1/[resource]

dotenv.load();

const app = express();

/**
 * Social Login Settings
 */
const FACEBOOK_SCOPE = process.env.FACEBOOK_SCOPE ? process.env.FACEBOOK_SCOPE.split(',') : ['email', 'user_location'];

/**
 * Get port from environment and store in Express.
 */

const appPort = normalizePort(process.env.PORT || '3000');
app.set('port', appPort);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Create Socket.io server.
 */
const io = require('socket.io')(server);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(appPort);
server.on('error', onError);
server.on('listening', onListening);

// Define cookie expire date and session store
const cookieExpirationDate = new Date();
const cookieExpirationDays = 1;
cookieExpirationDate.setDate(cookieExpirationDate.getDate() + cookieExpirationDays);
const sessionStore = new FileStore({ path: './sessions' });

// Initialize database connection
const knex = Knex(knexConfig);
// Bind all models to a knex instance (for only one database).
// If there is more than one database, use Model.bindKnex method.
Model.knex(knex);

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
  store: sessionStore,
  secret: process.env.SECRET_KEY,
  resave: true,
  key: process.env.SESSION_KEY,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: cookieExpirationDate
  }
}));

// Authorize Socket.io via session info stored by Passport
io.use(passportSocketIo.authorize({
  cookieParser,
  key: process.env.SESSION_KEY,
  secret: process.env.SECRET_KEY,
  store: sessionStore
}));

io.on('connection', (socket) => {
  log('a user connected');
  socket.on('disconnect', () => {
    log('user disconnected');
  });
});

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
app.get('/forgot', accountController.forgotGet);
app.post('/forgot', accountController.forgotPost);
app.get('/reset/:token', accountController.resetGet);
app.post('/reset/:token', accountController.resetPost);
app.get('/auth/facebook', passport.authenticate('facebook', { scope: FACEBOOK_SCOPE }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/login'
}));
app.get('/contact', contactController.contactGet);
app.post('/contact', contactController.contactPost);

// WITH authentication
app.get('/profile', ensureAuthenticatedRedirect(), accountController.profileGet);
app.put('/profile', ensureAuthenticatedRedirect(), accountController.profilePut);
app.put('/change_password', ensureAuthenticatedRedirect(), accountController.changePassword);
app.get('/unlink/:provider', ensureAuthenticatedRedirect(), accountController.unlinkProvider);
app.delete('/profile', ensureAuthenticatedRedirect(), accountController.profileDelete);
app.use('/notes', ensureAuthenticatedRedirect(), notesRoutes);
app.use('/api/v1', apiRoutes);

notesRoutes.socketio(io);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// general error handler
app.use((err, req, res, next) => {
  logError(`${(err.status || err.statusCode || 500)} ${err.message || err.data || {}}`);

  // Handle validation errors from Objection.js ORM
  if (err.constructor.name === 'ValidationError') {
    logError('ORM VALIDATION ERROR');
    res.status(err.statusCode || err.status || 500).json({
      error: {
        code: 'VALIDATION-ERROR',
        http_code: err.statusCode,
        message: err.data || {}
      }
    });
  } else if (err instanceof PgError) {
    // Handle errors from the Postgresql database
    logError('PG DB ERROR');
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
    logError(`App crashed!! - ${(err.stack || err)}`);
  });
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof appPort === 'string'
    ? `Pipe ${appPort}`
    : `Port ${appPort}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logError(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logError(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}


module.exports = app;

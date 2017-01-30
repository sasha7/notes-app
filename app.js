const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const flash = require('express-flash');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const fs = require('fs');
const hbsHelpers = require('./helpers/handlebars');
const error = require('debug')('notes-app:error');
const dotenv = require('dotenv');
const Knex = require('knex');
const knexConfig = require('./knexfile');
const Model = require('objection').Model;
const util = require('util');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const authentication = require('./authentication');
const ensureAuthenticated = require('./authentication/middleware');
const expressValidator = require('express-validator');
const helpers = require('./lib/helpers');
const parseUniqueViolationError = helpers.parseUniqueViolationError;
const isPostgresError = helpers.isPostgresError;

dotenv.load();

// Initialize knex.
const knex = Knex(knexConfig);

// Bind all models to a knex instance (for only one database).
// If there is more than one database, use Model.bindKnex method.
Model.knex(knex);

const index = require('./routes/index');
const users = require('./routes/users');
const notes = require('./routes/notes');
const login = require('./routes/login');
const logout = require('./routes/logout');

const app = express();

authentication.init(app);

// register Handlebars helpers and partials
hbsHelpers(hbs);
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.disable('x-powered-by');

if (app.get('env') === 'development') {
  app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev'));
}

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// An express.js middleware for node-validator.
app.use(expressValidator());

app.use(cookieParser());

// Server files in public
app.use(express.static(path.join(__dirname, 'public')));

// Initialize session filestore
app.use(session({
  store: new FileStore({ path: './sessions' }),
  secret: process.env.SECRET_KEY,
  resave: true,
  saveUninitialized: true
}));

// Use flash messages
app.use(flash());

// Initialize passport to use sessions
app.use(passport.initialize());
app.use(passport.session());


// If user is authenticated, set local vars for templates
app.use((req, res, next) => {
  if (req.user) {
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.user;
  }
  next();
});

app.use('/', index);
app.use('/users', users);
app.use('/notes', [ensureAuthenticated], notes);
app.use('/login', login);
app.use('/logout', logout);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  error(`${(err.status || err.statusCode || 500)} ${err.message || err.data || {}}`);

  // Handle validation errors from Objection.js ORM
  if (err.constructor.name === 'ValidationError') {
    error('ORM VALIDATION ERRORS');

    res.status(err.statusCode || err.status || 500).json({
      error_type: 'validation',
      errors: err.data || {}
    });
  } else if (isPostgresError(err)) {
    // Handle unique violation constraint errors from the Postgresql database itself
    error('DATABASE UNIQUE VIOLATION ERROR');

    const uniqueViolationErrors = parseUniqueViolationError(err);
    res.status(400).json({
      error_type: 'validation',
      errors: uniqueViolationErrors || {}
    });
  } else { // Render 500 error as a html page
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }
});

// handle uncaught exceptions - ONLY IN DEVELOPMENT
if (app.get('env') === 'development') {
  process.on('uncaughtException', (err) => {
    error(`App crashed!! - ${(err.stack || err)}`);
  });
}

module.exports = app;

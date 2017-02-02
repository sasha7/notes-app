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
const dotenv = require('dotenv');
const Knex = require('knex');
const knexConfig = require('./knexfile');
const Model = require('objection').Model;
const util = require('util');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const authentication = require('./authentication');
const ensureAuthenticated = authentication.middleware;
const expressValidator = require('express-validator');
const helpers = require('./lib/helpers');
const parseUniqueViolationError = helpers.parseUniqueViolationError;
const isPostgresError = helpers.isPostgresError;
const methodOverride = require('method-override');

// Routes and Controllers
const homeController = require('./controllers/home.controller');
const authController = require('./controllers/auth.controller');
const usersRoutes = require('./routes/users');
const notesRoutes = require('./routes/notes');
const apiRoutes = require('./routes/api');

dotenv.load();

// Initialize database connection.
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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

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
  saveUninitialized: true
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
app.get('/', homeController.index);
app.get('/login', authController.loginGet);
app.post('/login', authController.loginPost);
app.get('/logout', authController.logoutGet);

app.use('/api/v1', apiRoutes);
app.use('/notes', [ensureAuthenticated], notesRoutes);
app.use('/users', [ensureAuthenticated], usersRoutes);


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
      errors: err.data || {}
    });
  } else if (isPostgresError(err)) {
    // Handle errors from the Postgresql database ()
    error('DATABASE ERROR');
    const uniqueViolationErrors = parseUniqueViolationError(err);
    res.status(400).json({
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

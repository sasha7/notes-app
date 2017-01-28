const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const flash = require('express-flash');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const fs = require('fs');
const rotator = require('file-stream-rotator');
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

dotenv.load();

// Initialize knex.
const knex = Knex(knexConfig.development);

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

// create a write stream in append mode
// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flag: 'a' });

// setup log rotator
let accessLogStreamRot;

if (process.env.REQUEST_LOG_FILE) {
  const logDir = path.dirname(process.env.REQUEST_LOG_FILE);
  fs.existsSync(logDir) || fs.mkdirSync(logDir);
  accessLogStreamRot = rotator.getStream({
    filename: process.env.REQUEST_LOG_FILE,
    frequency: 'daily',
    verbose: false
  });
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev'));

// setup logger and log only error responses to access.log - without log rotation
// app.use(logger('combined', {
//  stream: accessLogStream,
//  skip: (req, res) => res.statusCode < 400
// }));


// setup logger and log only error responses to access.log - with log rotation
// app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev', {
//   stream: accessLogStreamRot || process.stdout,
//   skip: (req, res) => res.statusCode < 400
// }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new FileStore({ path: './sessions' }),
  secret: 'Sn3q7Le0P5q|w_tRU&tJ@+e(&Lfj9Pn',
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

/**
 * If user is authenticated, set info for templates
 */
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
  // handle validation errors from Objection.js ORM
  if (err.constructor.name === 'ValidationError') {
    res.status(err.statusCode || err.status || 500).json(err.data || {});
  } else {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }
});

// handle uncaught exceptions - DO NOT USE IN PROD
// if (app.get('env') === 'development') {
//   process.on('uncaughtException', (err) => {
//     error(`App crashed!! - ${(err.stack || err)}`);
//   });
// }

module.exports = app;

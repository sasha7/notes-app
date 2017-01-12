const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const fs = require('fs');
const hbsHelpers = require('./helpers/handlebars');

const index = require('./routes/index');
const users = require('./routes/users');
const notes = require('./routes/notes');

const app = express();

// register Handlebars helpers and partials
hbsHelpers(hbs);
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// create a write stream in append mode
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flag: 'a' });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev'));

// setup logger and log only error responses to access.log - without log rotation
app.use(logger('combined', { stream: accessLogStream, skip: (req, res) => res.statusCode < 400 }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/notes', notes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

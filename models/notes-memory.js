// Simple in-memory data store for notes.
// Does not offer long-term data persistence.
// Data store exists only while server is running.
// Implements a simple CRUD features.

const notes = [{
  key: 0,
  title: '1st note',
  body: 'lalalala land'
}];

const Note = require('./note');

exports.update = exports.create = (key, title, body) => new Promise((resolve, reject) => {
  notes[key] = new Note(key, title, body);
  resolve(notes[key]);
});

exports.read = key => new Promise((resolve, reject) => {
  if (notes[key]) resolve(notes[key]);
  else {
    const err = new Error(`Note ${key} does not exist`);
    err.status = 404;
    reject(err);
  }
});

exports.destroy = key => new Promise((resolve, reject) => {
  if (notes[key]) {
    delete notes[key];
    resolve();
  } else {
    const err = new Error(`Note ${key} does not exist`);
    err.status = 404;
    reject(err);
  }
});

exports.keylist = () => new Promise((resolve, reject) => {
  resolve(Object.keys(notes));
});

exports.count = () => new Promise((resolve, reject) => {
  resolve(notes.length);
});

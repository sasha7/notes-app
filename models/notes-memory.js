// Simple in-memory data store for notes.
// Does not offer long-term data persistence.
// Data store exists only while server is running.
// Implements a simple CRUD features.
const uuidV4 = require('uuid/v4');
const Note = require('./note');

// Notes list example:
// [ 'c5367668-5191-4aca-854f-ac57c2277956': Note {
//     key: 'c5367668-5191-4aca-854f-ac57c2277956',
//     title: 'sad',
//     body: 'sads' },
//   '64245452-e3a7-4497-be8a-43c73d81edb9': Note {
//     key: '64245452-e3a7-4497-be8a-43c73d81edb9',
//     title: 'sd',
//     body: 'asd' }]
const notes = [];

exports.update = (key, title, body) => new Promise((resolve, reject) => {
  notes[key] = new Note(key, title, body);
  resolve(notes[key]);
});

exports.create = (title, body) => new Promise((resolve, reject) => {
  const key = `${uuidV4()}`;
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

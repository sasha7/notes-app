// LevelUp data store - a Node.js-friendly wrapper arround
// LevelDB engine is a database library (C++) developed by Google.
// It is an embedded database, i.e. one you use directly in your app
// and it runs in the same process as your program.
// The interface is a key-value store.
// Normally used in browsers as key-value store.
// Non-indexed, ordered key-value NoSQL data store. It doesn't provide indexing or querying.
// IMPORTANT: LevelDB doesn't support simultaneous access to a
// database from multiple node instances

const levelup = require('levelup');
const util = require('util');
const uuidV4 = require('uuid/v4');
const log = require('debug')('note-app:levelup-model');
const error = require('debug')('notes-app:error');
const Note = require('../models/note');

let db;

const connectDB = () => new Promise((resolve, reject) => {
  if (db) return resolve(db);
  // Main entry point for creating a new LevelUP instance and
  // opening the underlying store with LevelDB.
  levelup(
    process.env.LEVELUP_DB_LOCATION || 'notes.levelup',
    {
      createIfMissing: true,
      valueEncoding: 'json'
    },
    (err, _db) => {
      if (err) return reject(err);
      db = _db;
      return resolve();
    }
  );
});

exports.create = (title, body) => connectDB().then(() => {
  const key = uuidV4();
  const note = new Note(key, title, body);
  return new Promise((resolve, reject) => {
    db.put(key, note, (err) => {
      if (err) reject(err);
      else resolve(note);
    });
  });
});

exports.update = (key, title, body) => connectDB().then(() => {
  const note = new Note(key, title, body);
  return new Promise((resolve, reject) => {
    db.put(key, note, (err) => {
      if (err) reject(err);
      else resolve(note);
    });
  });
});


exports.read = key => connectDB().then(() => new Promise((resolve, reject) => {
  db.get(key, (err, note) => {
    if (err) reject(err);
    else resolve(new Note(note.key, note.title, note.body));
  });
}));

exports.destroy = key => connectDB().then(() => new Promise((resolve, reject) => {
  db.del(key, (err) => {
    if (err) reject(err);
    else resolve();
  });
}));

exports.keylist = () => connectDB().then(() => {
  let keys = [];
  return new Promise((resolve, reject) => {
    // Obtain a ReadStream of the full database
    // It provides an EventEmitter style interface
    db.createReadStream()
      .on('data', data => keys.push(data.key))
      .on('error', err => reject(err))
      .on('end', () => resolve(keys));
  });
});


exports.count = () => connectDB().then(() => {
  let total = 0;
  return new Promise((resolve, reject) => {
    db.createReadStream()
      .on('data', (data) => { total += 1; })
      .on('error', err => reject(err))
    .on('end', () => resolve(total));
  });
});

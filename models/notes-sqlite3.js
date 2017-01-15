const sqlite3 = require('sqlite3');
const log = require('debug')('notes-app:sqlite3-model');
const error = require('debug')('notes-app:error');
const uuidV4 = require('uuid/v4');
const util = require('util');
const Note = require('../models/note');

sqlite3.verbose();

let db;

// Manage database connection
const connectDB = () => new Promise((resolve, reject) => {
  if (db) return resolve(db);
  const dbfile = process.env.SQLITE_FILE || 'notes.sqlite3';

  db = new sqlite3.Database(dbfile,
    sqlite3.OPEN_READWRITE || sqlite3.OPEN_CREATE,
    (err) => {
      if (err) reject(err);
      else {
        log(`Opened SQLite3 database ${dbfile}`);
        resolve(db);
      }
    }
  );
});

exports.create = (title, body) => connectDB().then(() => {
  const key = uuidV4();
  const note = new Note(key, title, body);

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notes (key, title, body) VALUES (?, ?, ?)',
      [key, title, body],
      (err) => {
        if (err) reject(err);
        else {
          log(`CREATE ${util.inspect(note)}`);
          resolve(note);
        }
      }
    );
  });
});

exports.update = (key, title, body) => connectDB().then(() => {
  const note = new Note(key, title, body);
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notes
      SET title = ?, body = ?
      WHERE key = ?`,
      [title, body, key],
      (err) => {
        if (err) reject(err);
        else {
          log(`UPDATE ${util.inspect(note)}`);
          resolve(note);
        }
      }
    );
  });
});

exports.read = key => connectDB().then(() => new Promise((resolve, reject) => {
  db.get(
    'SELECT * from notes WHERE key = ?',
    [key],
    (err, row) => {
      if (err) reject(err);
      else {
        const note = new Note(row.key, row.title, row.body);
        log(`READ ${util.inspect(note)}`);
        resolve(note);
      }
    }
  );
}));

exports.destroy = key => connectDB().then(() => new Promise((resolve, reject) => {
  db.run(
    'DELETE from notes WHERE key = ?',
    [key],
    (err) => {
      if (err) reject(err);
      else {
        log(`DESTROY ${key}`);
        resolve();
      }
    }
  );
}));

exports.keylist = () => connectDB().then(() => new Promise((resolve, reject) => {
  const keys = [];
  db.each(
    'SELECT key FROM notes',
    (err, row) => {
      if (err) reject(err);
      else {
        keys.push(row.key);
      }
    },
    (err, num) => {
      if (err) reject(err);
      else {
        log(`NUM ${num}`);
        resolve(keys);
      }
    }
  );
}));

exports.count = () => connectDB().then(() => new Promise((resolve, reject) => {
  db.get(
    'SELECT count(key) as count FROM notes',
    (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    }
  );
}));

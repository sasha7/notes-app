const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const log = require('debug')('notes-app:fs-model');
const error = require('debug')('notes-app:error');
const Note = require('./note');
const uuidV4 = require('uuid/v4');

// NOTES_FS_DIR = configure directory within which to store notes
const notesDir = () => {
  const dir = process.env.NOTES_FS_DIR || 'notes-fs-data';
  return new Promise((resolve, reject) => {
    fs.ensureDir(dir, (err) => {
      if (err) reject(err);
      else resolve(dir);
    });
  });
};

const filePath = (notesdir, key) => path.join(notesdir, `${key}.json`);

const readJSON = (notesdir, key) => {
  const readFrom = filePath(notesdir, key);
  return new Promise((resolve, reject) => {
    fs.readFile(readFrom, 'utf8', (err, data) => {
      if (err) reject(err);
      log(`readJSON ${data}`);
      resolve(Note.fromJSON(data));
    });
  });
};

exports.create = (title, body) => notesDir().then((notesdir) => {
  const key = `${uuidV4()}`;
  const note = new Note(key, title, body);
  const writeTo = filePath(notesdir, key);
  const writeJSON = note.JSON;

  log(`WRITE ${writeTo} ${writeJSON}`);

  return new Promise((resolve, reject) => {
    fs.writeFile(writeTo, writeJSON, 'utf8', (err) => {
      if (err) reject(err);
      else resolve(note);
    });
  });
});

exports.update = (key, title, body) => notesDir().then((notesdir) => {
  const note = new Note(key, title, body);
  const writeTo = filePath(notesdir, key);
  const writeJSON = note.JSON;

  log(`UPDATE ${writeTo} ${writeJSON}`);

  return new Promise((resolve, reject) => {
    fs.writeFile(writeTo, writeJSON, 'utf8', (err) => {
      if (err) reject(err);
      else resolve(note);
    });
  });
});

exports.read = key => notesDir().then(notesdir => readJSON(notesdir, key).then((note) => {
  log(`READ ${notesdir}/${key} ${util.inspect(note)}`);
  return note;
}));

// The fs.unlink function deletes our file
exports.destroy = key => notesDir().then(notesdir => new Promise((resolve, reject) => {
  fs.unlink(filePath(notesdir, key), (err) => {
    if (err) reject(err);
    else resolve();
  });
}));


// returns a Promise that will resolve to an array of keys for existing notes objects
// stored as individual files in the notesdir
exports.keylist = () => notesDir()
  .then(notesdir => new Promise((resolve, reject) => {
    fs.readdir(notesdir, (err, files) => {
      if (err) reject(err);
      if (!files) files = [];
      resolve({ notesdir, files });
    });
  }))
  .then((data) => {
    log(`keylist dir ${data.notesdir} files=${util.inspect(data.files)}`);

    // Construct array containing Promise objects that read each file and resolve the promise
    // with the key.
    const notes = data.files.map((fname) => {
      const key = path.basename(fname, '.json');
      log(`About to read ${data.notesdir} ${key}`);

      return readJSON(data.notesdir, key).then(note => note.key);
    });

    // process the array of Promises
    return Promise.all(notes);
  });

// Count of notes is a simple count of files in notesdir
exports.count = () => notesDir()
  .then(notesdir => new Promise((resolve, reject) => {
    fs.readdir(notesdir, (err, files) => {
      if (err) reject(err);
      else resolve(files.length);
    });
  })
);

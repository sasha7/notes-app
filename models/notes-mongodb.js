const util = require('util');
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const log = require('debug')('notes-app:mongodb-model');
const error = require('debug')('notes-app:error');
const uuid = require('uuid/v4');
const Note = require('../models/note');

let db;

const connectDB = () => new Promise((resolve, reject) => {
  if (db) return resolve(db);

  const url = process.env.MONGO_URL || 'mongodb://localhost/notes';

  MongoClient.connect(url, (err, _db) => {
    if (err) return reject(err);
    db = _db;
    return resolve(_db);
  });
});

exports.create = (title, body) => connectDB().then((_db) => {
  const key = uuid();
  const note = new Note(key, title, body);

  const collection = _db.collection('notes');
  return collection.insertOne({ key, title, body }).then(result => note);
});

exports.update = (key, title, body) => connectDB().then((_db) => {
  const note = new Note(key, title, body);

  const collection = _db.collection('notes');
  return collection.updateOne({ key }, { $set: { title, body } })
    .then(result => note);
});

exports.read = key => connectDB().then((_db) => {
  const collection = _db.collection('notes');
  return collection.findOne({ key })
    .then((doc) => {
      const note = new Note(doc.key, doc.title, doc.body);
      return note;
    });
});

exports.destroy = key => connectDB().then((_db) => {
  const collection = _db.collection('notes');
  return collection.findOneAndDelete({ key });
});

exports.keylist = () => connectDB().then((_db) => {
  const collection = _db.collection('notes');
  return new Promise((resolve, reject) => {
    let keys = [];
    collection.find({}).forEach((note) => { keys.push(note.key); }, (err) => {
      if (err) reject(err);
      else resolve(keys);
    });
  });
});

exports.count = () => connectDB().then((_db) => {
  const collection = _db.collection('notes');
  return new Promise((resolve, reject) => {
    collection.count({}, (err, count) => {
      if (err) reject(err);
      else resolve(count);
    })
  });

});

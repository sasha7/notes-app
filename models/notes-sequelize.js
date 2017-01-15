const util = require('util');
const fs = require('fs-extra');
const jsyaml = require('js-yaml');
const Sequelize = require('sequelize');
const log = require('debug')('notes-app:sequelize-models');
const error = require('debug')('notes-app:error');
const uuidV4 = require('uuid/v4');

const Note = require('../models/note');

const connectDB = () => {
  let SQNote;
  let sequelz;

  if (SQNote) return SQNote.sync();

  return new Promise((resolve, reject) => {
    fs.readFile(process.env.SEQUELIZE_CONNECT, 'utf-8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  })
  .then(yamltext => jsyaml.safeLoad(yamltext, 'utf8'))
  .then((config) => {
    // Setting up a connection
    sequelz = new Sequelize(config.dbname, config.username, config.password, config.params);

    // Define a model
    SQNote = sequelz.define('Note', {
      key: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true
      },
      title: Sequelize.STRING,
      body: Sequelize.TEXT
    });

    // Sync this Model to the DB, that is create the table
    // (it doesnt drop the table if it already exists)
    return SQNote.sync();
  });
};

exports.create = (title, body) => connectDB().then((SQNote) => {
  const key = uuidV4();
  return SQNote.create({
    key,
    title,
    body
  });
});

exports.update = (key, title, body) => connectDB().then(SQNote =>
  SQNote.find({ where: { key } })
    .then((note) => {
      if (!note) throw new Error(`No note found ${key}`);
      else {
        return note.updateAttributes({
          title,
          body
        });
      }
    })
  );

exports.read = key => connectDB().then(SQNote =>
  SQNote.find({ where: { key } })
    .then((note) => {
      if (!note) throw new Error(`No note found for key ${key}`);
      else {
        return new Note(note.key, note.title, note.body);
      }
    })
);

exports.destroy = key => connectDB().then(SQNote =>
  SQNote.find({ where: { key } })
    .then((note) => {
      if (!note) throw new Error(`No note found key ${key}`);
      else {
        return note.destroy();
      }
    })
  );

exports.keylist = () => connectDB().then(SQNote =>
  SQNote.findAll({ attributes: ['key'] })
    .then(notes => notes.map(note => note.key))
  );

exports.count = () => connectDB().then(SQNote => SQNote.count().then(count => count));

const EventEmitter = require('events');
const log = require('debug')('notes-app:events');
class ModelEmitter extends EventEmitter {

}

const ModelEvents = new ModelEmitter();

const created = (model, payload) => {
  ModelEvents.emit(`${model}:created`, payload);
};

const updated = (model, payload) => {
  ModelEvents.emit(`${model}:updated`, payload);
};

const deleted = (model, payload) => {
  ModelEvents.emit(`${model}:deleted`, payload);
};

ModelEvents.created = created;
ModelEvents.updated = updated;
ModelEvents.deleted = deleted;

module.exports = ModelEvents;

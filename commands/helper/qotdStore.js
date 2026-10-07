const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { readJson, writeJson } = require('./jsonStore');

function createQotdStore(file = path.join(__dirname, '../../data/qotdQueue.json')) {
  function load() {
    const queue = readJson(file, []);
    if (!Array.isArray(queue) || queue.some(q => !q || typeof q.question !== 'string')) throw new Error('Invalid QOTD queue; restore a valid backup.');
    let changed = false;
    for (const entry of queue) if (!entry.id) { entry.id = randomUUID(); changed = true; }
    if (changed) writeJson(file, queue);
    return queue;
  }
  return {
    load,
    add(entry) { const queue = load(); queue.push({ ...entry, id: randomUUID() }); writeJson(file, queue); return queue.length; },
    remove(id) { const queue = load(); const next = queue.filter(q => q.id !== id); writeJson(file, next); return next.length !== queue.length; }
  };
}
module.exports = { ...createQotdStore(), createQotdStore };

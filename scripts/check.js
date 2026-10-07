const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
let count = 0;
function check(file) {
  new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  count++;
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith('.js')) check(file);
  }
}
for (const file of ['index.js', 'deploy-commands.js']) check(path.join(root, file));
for (const dir of ['commands', 'events', 'scripts', 'test']) walk(path.join(root, dir));
const commands = require('../commands/helper/loadCommands').loadCommands();
if (new Set(commands.map(c => c.data.name)).size !== commands.length) throw new Error('Duplicate command names');
console.log(`Syntax checked ${count} JavaScript files; validated ${commands.length} slash commands.`);

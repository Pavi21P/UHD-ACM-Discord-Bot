const fs = require('node:fs');
const path = require('node:path');

function loadCommands() {
  const commands = [];
  const root = path.join(__dirname, '..', 'utility');
  for (const file of fs.readdirSync(root).filter(name => name.endsWith('.js'))) {
    const command = require(path.join(root, file));
    if (!command.data || typeof command.execute !== 'function') throw new Error(`Invalid command: ${file}`);
    // All commands in this bot are intended for servers.
    command.data.setDMPermission(false);
    command.data.toJSON();
    commands.push(command);
  }
  return commands;
}

module.exports = { loadCommands };

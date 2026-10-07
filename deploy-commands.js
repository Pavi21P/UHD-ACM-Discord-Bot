const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { REST, Routes } = require('discord.js');
const { loadCommands } = require('./commands/helper/loadCommands');
const commands = loadCommands().map(command => command.data.toJSON());
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (process.argv.includes('--check')) {
  console.log('Validated ' + commands.length + ' slash commands (no Discord requests sent).');
} else if (!token || !clientId) {
  console.error('Set DISCORD_TOKEN and CLIENT_ID in .env or your hosting panel.');
  process.exitCode = 1;
} else {
  const route = guildId ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId);
  new REST({ version: '10' }).setToken(token).put(route, { body: commands })
    .then(() => console.log('Registered ' + commands.length + ' commands ' + (guildId ? 'for the configured guild.' : 'globally.')))
    .catch(error => { console.error(error); process.exitCode = 1; });
}

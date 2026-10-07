const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client, GatewayIntentBits, Collection, Events, Partials } = require('discord.js');
const { loadCommands } = require('./commands/helper/loadCommands');
const { runEvent } = require('./commands/helper/eventRunner');
const { sendShutdownDm } = require('./commands/helper/serverLogger');
const { scheduleQotd } = require('./commands/helper/qotdScheduler');
if (!process.env.DISCORD_TOKEN) { console.error('Missing DISCORD_TOKEN. Set it in .env or your hosting panel.'); process.exit(1); }
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  allowedMentions: { parse: [], repliedUser: false }
});
client.commands = new Collection(loadCommands().map(command => [command.data.name, command]));
for (const file of fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'))) {
  const event = require(path.join(__dirname, 'events', file));
  if (typeof event.name !== 'string' || typeof event.execute !== 'function') continue;
  client[event.once ? 'once' : 'on'](event.name, (...args) => { void runEvent(event, ...args); });
}
// Bound the deduplication cache for long-running hosts.
const reacted = new Set();
client.on(Events.MessageReactionAdd, (reaction, user) => {
  void runEvent({ name: Events.MessageReactionAdd, async execute() {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (!reaction.message.guild) return;
    const emoji = reaction.emoji.name;
    const threshold = emoji === '🍅' ? 3 : emoji === 'true' ? 5 : null;
    const key = reaction.message.id + ':' + emoji;
    if (!threshold || reaction.count < threshold || reacted.has(key)) return;
    reacted.add(key);
    if (reacted.size > 10000) reacted.delete(reacted.values().next().value);
    try {
      await reaction.message.reply(emoji === '🍅'
        ? { content: '🍅 Tomato! https://ibb.co/RpRQ5xCM' }
        : { files: [path.join(__dirname, 'images', 'truth nuke.png')] });
    } catch (error) { reacted.delete(key); throw error; }
  } });
});
let stopQotd = () => {};
client.once(Events.ClientReady, () => { void runEvent({ name: 'qotdStartup', execute() { stopQotd = scheduleQotd(client); } }); });
client.on('error', error => console.error('[Discord client]', error));
client.on('warn', message => console.warn('[Discord client]', message));
// Wispbyte runs the bot process directly. HTTP health checks are optional.
let server;
if (process.env.PORT) {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
  const app = require('express')();
  app.get('/', (request, response) => response.status(client.isReady() ? 200 : 503).send(client.isReady() ? 'Bot is running' : 'Bot is connecting'));
  server = app.listen(port, '0.0.0.0', () => console.log('Health endpoint listening on ' + port));
  server.on('error', error => { console.error('[HTTP]', error); process.exit(1); });
}
let shuttingDown = false;
async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('Shutting down (' + signal + ')...');
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  stopQotd();
  clearInterval(client.heartbeatInterval);
  server?.close();
  try { if (client.isReady()) await sendShutdownDm(client, 'Host sent ' + signal); }
  catch (error) { console.error('Shutdown notification failed:', error); }
  finally { client.destroy(); process.exit(0); }
}
process.once('SIGINT', () => { void gracefulShutdown('SIGINT'); });
process.once('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
client.login(process.env.DISCORD_TOKEN).catch(error => { console.error('Discord login failed:', error); process.exit(1); });

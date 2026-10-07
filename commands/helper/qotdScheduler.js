const store = require('./qotdStore');
function nextPostTime(now = new Date(), timeZone = process.env.QOTD_TIMEZONE || 'America/Chicago') {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
  // Search absolute minutes, so DST changes cannot shift the local posting hour.
  const start = Math.floor(now.getTime() / 60000) * 60000 + 60000;
  for (let t = start; t < start + 49 * 3600000; t += 60000) {
    if (formatter.format(new Date(t)) === '10:00') return new Date(t);
  }
  throw new Error('Could not determine the next QOTD time');
}
async function postNext(client, channelId, queueStore = store) {
  const entry = queueStore.load()[0];
  if (!entry) return;
  const channel = await client.channels.fetch(channelId);
  if (!channel?.isTextBased() || !channel.isSendable() || !channel.guildId) throw new Error('QOTD_CHANNEL_ID must be a sendable server channel');
  if (entry.guildId && entry.guildId !== channel.guildId) throw new Error('Queued question belongs to another server; check QOTD_CHANNEL_ID');
  await channel.send({ content: '🌅 **Question of the Day**\n\n❓ ' + entry.question.slice(0, 1500) + '\n\n*Submitted by ' + String(entry.submittedBy).slice(0, 100) + '*', allowedMentions: { parse: [] } });
  // Reload after the await: preserve questions submitted/deleted while sending.
  queueStore.remove(entry.id);
}
function scheduleQotd(client) {
  const channelId = process.env.QOTD_CHANNEL_ID;
  if (!channelId) { console.log('[QOTD] Disabled: set QOTD_CHANNEL_ID to enable.'); return () => {}; }
  let stopped = false;
  let timer;
  function schedule(delay = nextPostTime().getTime() - Date.now()) {
    if (stopped) return;
    console.log('[QOTD] Next attempt in ' + Math.round(delay / 60000) + ' minutes');
    timer = setTimeout(async () => {
      let retry = false;
      try { await postNext(client, channelId); }
      catch (error) { retry = true; console.error('[QOTD]', error); }
      if (!stopped) schedule(retry ? 5 * 60000 : undefined);
    }, Math.max(1, delay));
  }
  schedule();
  return () => { stopped = true; clearTimeout(timer); };
}
module.exports = { scheduleQotd, nextPostTime, postNext };

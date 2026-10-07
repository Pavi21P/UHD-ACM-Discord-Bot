const { Events } = require('discord.js');

const INTERVAL_MS = 5 * 60 * 1000;

async function sendHeartbeat(client) {
	const channelId = process.env.HEARTBEAT_CHANNEL_ID;
	if (!channelId) return;

	try {
		const channel = await client.channels.fetch(channelId);
		if (!channel?.isTextBased()) {
			console.error('[heartbeat] HEARTBEAT_CHANNEL_ID is not a text channel');
			return;
		}
		await channel.send({
			content: `✅ **Heartbeat** — bot online · \`${new Date().toISOString()}\``,
		});
	} catch (err) {
		console.error('[heartbeat] Failed to send:', err.message);
	}
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		if (!process.env.HEARTBEAT_CHANNEL_ID) {
			console.log('[heartbeat] Disabled — set HEARTBEAT_CHANNEL_ID to enable 5-minute pings');
			return;
		}

		void sendHeartbeat(client);
		client.heartbeatInterval = setInterval(() => {
			void sendHeartbeat(client);
		}, INTERVAL_MS);
	},
};
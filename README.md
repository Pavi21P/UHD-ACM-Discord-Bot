# ACMUHD Bot

Discord.js bot with moderation, server logs, QOTD, image conversion, and reaction triggers.

## Wispbyte setup

1. Select a Node.js 24 runtime (minimum supported here: Node.js 22.12).
2. Upload the project files, including package.json, package-lock.json, commands/, events/, data/, and images/. Do not upload local node_modules or .npm-cache; install packages on the Linux host with npm ci --omit=dev.
3. Configure DISCORD_TOKEN, CLIENT_ID, and GUILD_ID in the hosting environment, or upload your private .env file. The filename must begin with a dot. Never share the token. Panel variables take precedence over .env.
4. In the Discord Developer Portal, enable Server Members Intent and Message Content Intent for this bot. Invite it with the bot and applications.commands scopes.
5. Give the bot only the permissions required for your features: View Channels, Send Messages, Read Message History, Embed Links, Attach Files, Kick Members, Ban Members, Moderate Members, and Manage Messages for the filter. Put its role above members it must moderate. Manage Roles is only needed to remove legacy Muted roles.
6. Run npm run check and npm test. Run npm run deploy once to register the updated slash-command definitions. GUILD_ID registers commands for that server; an empty GUILD_ID registers globally. Registration overwrites the command set in the selected scope. Old commands registered in the other scope are not automatically removed; check Discord Integrations if you previously registered globally and see duplicates.
7. Set the startup/main file to index.js. Where the panel accepts a full command, use node index.js or npm start. Keep the panel's dependency-installing wrapper if one is supplied.

Wispbyte documentation: https://wispbyte.com/kb/startup-settings
Discord intents: https://docs.discord.com/developers/events/gateway#privileged-intents

A web keep-alive service is not required for this bot process. Leave PORT empty unless you want the optional HTTP health endpoint; if enabled, use the port allocated by the host. The endpoint returns 503 until Discord is ready.

## Configuration

Copy .env.example to .env for a new installation. Your existing env file has been renamed to .env without exposing its contents.

| Variable | Purpose |
| --- | --- |
| DISCORD_TOKEN | Bot token, required |
| CLIENT_ID | Application ID, required for registration |
| GUILD_ID | Server-specific command registration; blank means global |
| LEGACY_WARNINGS_GUILD_ID | Original server for old warning history; defaults to GUILD_ID |
| QOTD_CHANNEL_ID | QOTD destination; blank disables QOTD |
| QOTD_TIMEZONE | Defaults to America/Chicago; posts at 10 a.m. local time |
| HEARTBEAT_CHANNEL_ID | Optional channel for a heartbeat every five minutes |
| SHUTDOWN_NOTIFY_USER_ID | Optional DM recipient on graceful shutdown |
| OWNER_USER_ID | Fallback shutdown DM recipient |
| PORT | Optional HTTP health endpoint |

## Behavior and persistence

- Kick and ban require their respective member permissions. Mute/unmute require Moderate Members. Moderators cannot act on themselves, the bot, the owner, or equal/higher roles; the server owner is exempt from the actor role comparison.
- Mute uses Discord timeouts of 1–40320 minutes (28 days). Timeouts survive restarts. Unmute also removes the old Muted role when the bot has permission. Existing role-based mutes have no saved expiry; use /unmute to release them manually.
- Say requires Manage Messages. Both the moderator and bot need access to the destination. Mentions are suppressed.
- Warnings are server-specific. Existing records remain intact; on the next write they are migrated to the server configured in LEGACY_WARNINGS_GUILD_ID or GUILD_ID. With neither configured, old records are preserved but hidden until assigned. Set the original server ID before using warning commands. Warning history is moderator-only and paginated.
- QOTD supports one configured destination server. Users submit and delete their own questions; Manage Messages permits deleting any question. List output is paginated. Failed sends retain the question and retry after five minutes. New submissions made during a send are preserved. A restart schedules the next future 10 a.m.; missed posts while offline are not backfilled. A crash after Discord accepts a message but before the queue is saved can still cause a duplicate.
- Keep backups of commands/json-logs/warnings.json and data/qotdQueue.json. Do not overwrite these live data files during code updates. Run only one instance against these files.
- Server logs use audit-logs or server-logs. Uncached deleted messages show available metadata; their original content cannot be recovered. The in-memory edit tracker retains the latest 100 edits.
- Three tomato reactions trigger the tomato reply; five true reactions trigger images/truth nuke.png. Reaction deduplication is bounded and resets on restart.
- The message filter starts with an empty blacklist. Edit events/messageFilter.js to configure it.

## Local verification

npm ci
npm run check
npm test
node deploy-commands.js --check

These checks validate syntax, slash-command schemas, and behavior against mock Discord objects and temporary storage. They do not log in, register commands, or send messages. Live Discord permissions and Linux-host startup still require verification after upload.

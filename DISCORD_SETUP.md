# Discord setup

Get the bot token and your user ID, and invite the bot to your server.

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** → name it.
2. **Bot** tab → **Reset Token** → copy the token (this is `DISCORD_TOKEN`). Turn **ON** the **Message Content Intent**.
3. Invite it to your server: **OAuth2 → URL Generator** → check `bot` → check **Send Messages** + **Read Message History** → open the generated URL → pick your server → **Authorize**.
4. Get your own user ID (`OWNER_USER_ID`, which locks the bot to you): Discord **Settings → Advanced → Developer Mode ON**, then right-click your name → **Copy User ID**.

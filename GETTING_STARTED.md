# Getting started

A step-by-step walkthrough to get botman running. Do the steps in order. After
each step there's a **Run it** check so you can confirm your progress.

First, install dependencies once:

```bash
cd mcp-tools && npm install
cd ../bot && npm install
```

## Step 1: Set up the Discord bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** → name it.
2. **Bot** tab → **Reset Token** → copy the token. Turn **ON** the **Message Content Intent**.
3. Invite it to your server: **OAuth2 → URL Generator** → check `bot` → check **Send Messages** + **Read Message History** → open the generated URL → pick your server → **Authorize**.
4. Get your own Discord user ID: **Settings → Advanced → Developer Mode ON**, then right-click your name → **Copy User ID**.
5. Create the bot's env file:

```bash
cp bot/.env.example bot/.env
```

Fill in these two values in `bot/.env`:

```
DISCORD_TOKEN=<the token from step 2>
OWNER_USER_ID=<your user ID from step 4>
```

**Run it:** `cd bot && npm run dev`. You should see `[discord] logged in as <name>`. Stop with Ctrl-C. (It won't reply to DMs until the tools server is running in Step 6.)

## Step 2: Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) → add a little credit.
2. **API Keys → Create Key** → copy it (`sk-ant-…`).
3. Fill it into `bot/.env`:

```
ANTHROPIC_API_KEY=<your key>
```

This is what powers the bot's replies. The bot calls Anthropic directly, no gateway needed.

**Run it:** `cd bot && npm run dev` again. It still logs in, now with your key loaded.

## Step 3: Set timezone, model, and history

`bot/.env` already has these filled with sensible defaults. Change `TIMEZONE` to your own [IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (used when scheduling):

```
TIMEZONE=America/New_York
MODEL=claude-sonnet-4-6
HISTORY_LIMIT=10
```

Leave `MODEL` as-is for a good default: `claude-haiku-4-5` is cheapest, `claude-opus-4-8` is best. `HISTORY_LIMIT` is how many recent messages the bot reads back from the chat for context on each reply; set it to `0` to turn history off. That's all of `bot/.env` done.

**Run it:** `cd bot && npm run dev`. It should log in cleanly. `bot/.env` is now complete.

## Step 4: Set up Notion

The tools server saves your notes to a Notion database. First create its env file:

```bash
cp mcp-tools/.env.example mcp-tools/.env
```

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration** (Internal) → enable Read/Insert/Update → copy the secret (`ntn_…`) into `mcp-tools/.env`:

```
NOTION_TOKEN=<your secret>
```

2. Create a **full-page database** with these properties: `Name` (Title), `Tags` (Multi-select), `Status` (Select: `active`/`done`/`archived`), `Created` (Created time).
3. **Connect the integration** to it: open the database → **•••** → **Connections** → add your integration. (Easy to miss; the bot can't see the database without this.)
4. Grab the database ID from its URL, the 32-char hex chunk after the last `-` and before `?v=`, and fill it in:

```
NOTION_DATABASE_ID=<the 32-char id>
```

**Run it:** `cd mcp-tools && npm run dev` → `[mcp] tools server up on port 8080`. In another terminal, `curl localhost:8080/health` should print `ok`.

## Step 5: Set up Google Calendar

1. [console.cloud.google.com](https://console.cloud.google.com) → new project → **enable the Google Calendar API**.
2. **OAuth consent screen**: External; add the scope `https://www.googleapis.com/auth/calendar.events`; add your Gmail as a test user; **Publish to Production** (avoids the 7-day refresh-token expiry).
3. **Credentials → Create OAuth client ID → Desktop app** → copy the client ID and secret into `mcp-tools/.env`:

```
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
```

4. Get a refresh token. Run the one-time authorize script, open the printed URL, and approve:

```bash
cd mcp-tools && node scripts/google/authorize-google.mjs
```

Fill the `GOOGLE_REFRESH_TOKEN=…` it prints into `mcp-tools/.env`.

5. `TIMEZONE` in `mcp-tools/.env` is pre-filled. Set it to the same value you used in `bot/.env`:

```
TIMEZONE=America/New_York
```

That's all of `mcp-tools/.env` done (`PORT` stays at `8080`).

**Run it:** `cd mcp-tools && npm run dev`. It still comes up on port 8080, now fully configured.

## Step 6: Run everything

`MCP_SERVER_URL` in `bot/.env` is already set to `http://localhost:8080/mcp`, the port the tools server runs on. Leave it as-is for local; only change it if you run the tools server somewhere else.

Start both services in two terminals:

```bash
# terminal 1: tools server
cd mcp-tools && npm run dev

# terminal 2: bot
cd bot && npm run dev
```

When you see `[mcp] tools server up on port 8080` and `[discord] logged in as …`, DM your bot:

- **Save**: "remember to call the dentist tomorrow"
- **Recall**: "what do I need to do?"
- **Mark done**: "I called the dentist"
- **Schedule**: "set up a 30-min call with sam@example.com tomorrow at 3pm"

It only responds to you (`OWNER_USER_ID`). That's the full path working end to end.

## Prototyping: optional add-ons

Extra services for when you want to meter cost and dashboard usage. The bot works
fully without them; add them only if you want to experiment. They need **Docker**.

### agentgateway: proxy + per-request cost logging

Puts an LLM proxy in front of Anthropic. It holds the API key so the bot doesn't.

Benefits:

- **Meter cost**: logs the USD cost of every request.
- **LLM-agnostic gateway**: swap providers or models behind one endpoint without touching the bot.
- **MCP tool access control**: govern which MCP tools are reachable through it.

1. Create its env file and set your Anthropic key:

```bash
cp agentgateway/.env.example agentgateway/.env
```

```
ANTHROPIC_API_KEY=<your key>
```

2. Build and run it (serves on port 3000):

```bash
docker build -t agentgateway ./agentgateway
docker run --rm -p 3000:3000 -p 15020:15020 --env-file agentgateway/.env agentgateway
```

3. Point the bot at it by adding this line to `bot/.env`:

```
LLM_GATEWAY_URL=http://localhost:3000
```

Behind the gateway the real key lives in `agentgateway/.env`, so the bot's own `ANTHROPIC_API_KEY` is ignored.

**Run it:** with the gateway running, start the bot (`cd bot && npm run dev`) and DM it. The gateway's logs print a per-request line with `agw.ai.usage.cost.total` in USD.

### alloy: token-usage dashboards in Grafana Cloud

Scrapes agentgateway's metrics and ships them to Grafana Cloud, turning
per-request token counts into charts you can query over time. Requires the
agentgateway add-on above (running with port `15020` published, as shown) and a
free **Grafana Cloud** account. Grafana gets **token usage**; the USD cost figure
stays in the gateway's request logs.

Benefits:

- **Historical token usage**: token counts stored and queryable over time, not just per-request logs.
- **Dashboards + alerts**: chart token volume in Grafana and alert when it spikes.

1. In Grafana Cloud → **Prometheus → Send Metrics → Grafana Alloy**, copy the remote-write URL, the username (instance ID), and generate a token.
2. Create its env file and fill in those values:

```bash
cp alloy/.env.example alloy/.env
```

```
GRAFANA_PROM_URL=<remote-write url>
GRAFANA_PROM_USER=<instance id>
GRAFANA_PROM_TOKEN=<token>
SCRAPE_TARGET=host.docker.internal:15020
```

`SCRAPE_TARGET` points Alloy at your locally-running gateway's metrics port.

3. Build and run it:

```bash
docker build -t alloy ./alloy
docker run --rm --env-file alloy/.env alloy
```

**Run it:** with the gateway and bot running, DM the bot a few times, then in Grafana → **Explore** → your Prometheus datasource, query `agentgateway_gen_ai_client_token_usage_sum`.

For deploying all of this to the cloud, see [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md).

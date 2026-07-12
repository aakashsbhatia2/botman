# Run standalone with Anthropic (no Docker)

Run botman directly with Node, using Claude through Anthropic's OpenAI-compatible
endpoint.

For the one-command Docker version, see [DOCKER.md](DOCKER.md).
For local models, see [STANDALONE_OLLAMA.md](STANDALONE_OLLAMA.md).

## Prerequisites

- **Node.js 22+**
- An **Anthropic** API key with a little credit ([console.anthropic.com](https://console.anthropic.com) → **API Keys → Create Key**)

## 1. Get the code and install dependencies

```bash
git clone <repo-url> botman
cd botman
cd mcp-tools && npm install
cd ../bot && npm install
```

## 2. Get your credentials

See [GETTING_STARTED.md](GETTING_STARTED.md#1-get-your-credentials) for Discord, Notion, and Google.

## 3. Configure

```bash
cp bot/.env.example bot/.env
cp mcp-tools/.env.example mcp-tools/.env
```

In `bot/.env`, set the Discord values and point the LLM at Anthropic:

```
DISCORD_TOKEN=<token>
OWNER_USER_ID=<your id>
LLM_BASE_URL=https://api.anthropic.com/v1/
LLM_API_KEY=<your sk-ant- key>
LLM_MODEL=claude-sonnet-4-6
TIMEZONE=America/New_York
HISTORY_LIMIT=10
```

`claude-haiku-4-5` is cheapest, `claude-opus-4-8` is best. In `mcp-tools/.env`, set the Notion and Google values:

```
NOTION_TOKEN=<secret>
NOTION_DATABASE_ID=<32-char id>
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
GOOGLE_REFRESH_TOKEN=<refresh token>
TIMEZONE=America/New_York
PORT=8080
```

## 4. Run

Two terminals:

```bash
# tools server
cd mcp-tools && npm run dev

# bot
cd bot && npm run dev
```

When you see `[mcp] tools server up on port 8080` and `[discord] logged in as …`, DM your bot.

## Optional add-ons

Both run as Docker containers and are entirely optional; the bot works fully without them.

### agentgateway

An OpenAI-compatible proxy you point the bot at instead of Anthropic directly. It logs per-request tokens and USD cost, and holds the API key so the bot doesn't.

1. Put your Anthropic key in its env file (the gateway holds it now):

```bash
cp agentgateway/.env.example agentgateway/.env
```

Set `ANTHROPIC_API_KEY=sk-ant-...` in it.

2. Build and run it:

```bash
docker build -t agentgateway ./agentgateway
docker run --rm -p 3000:3000 --add-host=host.docker.internal:host-gateway --env-file agentgateway/.env agentgateway
```

3. Point the bot at it in `bot/.env`, then restart the bot:

```
LLM_BASE_URL=http://localhost:3000/v1
LLM_API_KEY=unused
LLM_MODEL=anthropic/claude-sonnet-4-6
```

### alloy

Ships the gateway's token metrics to Grafana Cloud for dashboards. Requires the gateway above and a free Grafana Cloud account.

1. From Grafana Cloud (**Prometheus → Send Metrics → Grafana Alloy**), copy the remote-write URL, username, and a token into its env file:

```bash
cp alloy/.env.example alloy/.env
```

2. Build and run it:

```bash
docker build -t alloy ./alloy
docker run --rm --add-host=host.docker.internal:host-gateway --env-file alloy/.env alloy
```

Then query `agentgateway_gen_ai_client_token_usage_sum` in Grafana. The scrape target is the gateway's metrics endpoint (`SCRAPE_TARGET` in `alloy/.env`); confirm it matches the stats address the gateway logs on startup.

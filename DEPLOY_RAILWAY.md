# Deploy to Railway

Railway deploys each folder as its own service (it does not run `docker-compose`,
which is local-only). Each service builds from its Dockerfile and they talk over
Railway's private network. Core is `mcp-tools` + `bot`; `agentgateway` and
`alloy` are optional.

Ollama needs a GPU, which Railway does not provide, so deploy with **Anthropic**
(or another hosted OpenAI-compatible endpoint).

## Fork first

Railway deploys from a GitHub repo you own and redeploys when you push to it, so
**fork this repo to your GitHub account** first. (`.env` and `node_modules` are
gitignored, so no secrets travel with it.) No fork? Deploy from a local clone with
the Railway CLI instead: `railway up`.

For each service below: **New → GitHub Repo → your fork**, set **Settings → Source
→ Root Directory**, **rename** it (sets its `*.railway.internal` hostname), add
**Variables**, deploy. Keep every service private.

## mcp-tools

Root Directory: `mcp-tools`

```
NOTION_TOKEN=...
NOTION_DATABASE_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
TIMEZONE=America/New_York
PORT=8080
```

Logs: `[mcp] tools server up on port 8080`.

## bot

Root Directory: `bot`

```
DISCORD_TOKEN=...
OWNER_USER_ID=...
TIMEZONE=America/New_York
HISTORY_LIMIT=10
MCP_SERVER_URL=http://mcp-tools.railway.internal:8080/mcp
LLM_BASE_URL=https://api.anthropic.com/v1/
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-sonnet-4-6
```

Logs: `[discord] logged in as …`, then DM the bot.

To route through the gateway instead, deploy `agentgateway` below and change the
bot's LLM vars to:

```
LLM_BASE_URL=http://agentgateway.railway.internal:3000/v1
LLM_API_KEY=unused
LLM_MODEL=anthropic/claude-sonnet-4-6
```

## agentgateway (optional)

Cost + token tracking, one endpoint for many providers. Root Directory: `agentgateway`

```
ANTHROPIC_API_KEY=sk-ant-...
```

Logs: `started bind`.

## alloy (optional)

Ships gateway token metrics to Grafana Cloud. Requires agentgateway and a free
Grafana Cloud account. Root Directory: `alloy`

```
GRAFANA_PROM_URL=...
GRAFANA_PROM_USER=...
GRAFANA_PROM_TOKEN=...
SCRAPE_TARGET=agentgateway.railway.internal:<stats port>
```

Set `SCRAPE_TARGET` to the stats address the gateway logs on startup (it must be
reachable on the private network). Verify in Grafana: query
`agentgateway_gen_ai_client_token_usage_sum`.

## Redeploy

Push to GitHub and Railway redeploys the service whose folder changed. Changed a
variable? Edit it in that service's **Variables** tab.

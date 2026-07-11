# Deploy to Railway

Each component ships as its own Railway service in one project, pointed at its
subfolder via **Settings → Source → Root Directory**, talking over the private
network. Core is `mcp-tools` + `bot`; `agentgateway` and `alloy` are optional.

Push first (`.env` and `node_modules` are gitignored):

```bash
git push
```

For each service below: **New → GitHub Repo → `botman`**, set its **Root
Directory**, **rename** it (sets its `*.railway.internal` hostname), add
**Variables**, deploy.

## mcp-tools

- Root Directory: `mcp-tools`
- Variables:

```
NOTION_TOKEN=...
NOTION_DATABASE_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
TIMEZONE=America/New_York
PORT=8080
```

- Verify: logs show `[mcp] tools server up on port 8080`. Keep it private.

## bot

- Root Directory: `bot`
- Variables:

```
DISCORD_TOKEN=...
OWNER_USER_ID=...
ANTHROPIC_API_KEY=...
TIMEZONE=America/New_York
MODEL=claude-sonnet-4-6
MCP_SERVER_URL=http://mcp-tools.railway.internal:8080/mcp
```

- Verify: logs show `[discord] logged in as …`, then DM the bot.

## agentgateway (optional)

LLM proxy that holds the key and logs per-request cost. Railway builds its Dockerfile.

- Root Directory: `agentgateway`
- Variables:

```
ANTHROPIC_API_KEY=...
```

- Point the bot at it: add `LLM_GATEWAY_URL=http://agentgateway.railway.internal:3000` to the bot's variables.
- Verify: logs show `started bind bind="bind/3000"`. Keep it private.

## alloy (optional)

Ships gateway token-usage metrics to Grafana Cloud. Requires agentgateway. Railway builds its Dockerfile.

- Root Directory: `alloy`
- Variables (from Grafana Cloud → **Prometheus → Send Metrics → Grafana Alloy**):

```
GRAFANA_PROM_URL=...
GRAFANA_PROM_USER=...
GRAFANA_PROM_TOKEN=...
```

- Verify: in Grafana → **Explore**, query `agentgateway_gen_ai_client_token_usage_sum`.

## Redeploy

Push to GitHub and Railway redeploys the service whose folder changed. Changed a
variable? Edit it in that service's **Variables** tab.

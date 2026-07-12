# Run standalone with Ollama (no Docker)

Run botman directly with Node and a local Ollama model. Your prompts and data
stay on your machine.

For the one-command Docker version, see [DOCKER.md](DOCKER.md).

## Prerequisites

- **Node.js 22+**
- **[Ollama](https://ollama.com)** installed and running (it runs as a background service, so it is usually already listening on port 11434)

## 1. Get the code and install dependencies

```bash
git clone <repo-url> botman
cd botman
cd mcp-tools && npm install
cd ../bot && npm install
```

## 2. Get your credentials

See [GETTING_STARTED.md](GETTING_STARTED.md#1-get-your-credentials) for Discord, Notion, and Google.

## 3. Pull a model

botman needs a **tool-capable** model (`llama3.1`, `qwen2.5`, and `mistral-nemo` work; many smaller models do not):

```bash
ollama pull llama3.1
```

Check the exact tag with `ollama list` (e.g. `llama3.1:8b`).

## 4. Configure

```bash
cp bot/.env.example bot/.env
cp mcp-tools/.env.example mcp-tools/.env
```

In `bot/.env`, set the Discord values and point the LLM at Ollama:

```
DISCORD_TOKEN=<token>
OWNER_USER_ID=<your id>
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3.1:8b
TIMEZONE=America/New_York
HISTORY_LIMIT=10
```

`LLM_API_KEY` is a throwaway placeholder Ollama ignores. In `mcp-tools/.env`, set the Notion and Google values:

```
NOTION_TOKEN=<secret>
NOTION_DATABASE_ID=<32-char id>
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
GOOGLE_REFRESH_TOKEN=<refresh token>
TIMEZONE=America/New_York
PORT=8080
```

## 5. Run

Two terminals:

```bash
# tools server
cd mcp-tools && npm run dev

# bot
cd bot && npm run dev
```

When you see `[mcp] tools server up on port 8080` and `[discord] logged in as …`, DM your bot. Local models are less reliable than Claude at tool calling, so expect the occasional miss on smaller models.

## Optional add-ons

Both run as Docker containers and are entirely optional; the bot works fully without them.

### agentgateway

An OpenAI-compatible proxy you point the bot at instead of Ollama directly. It tracks per-request tokens (and USD cost for paid models) and can route across providers behind one endpoint.

1. Create its env file (no Anthropic key needed for Ollama-only routing):

```bash
cp agentgateway/.env.example agentgateway/.env
```

2. Build and run it. `--add-host` lets the container reach the Ollama running on your host:

```bash
docker build -t agentgateway ./agentgateway
docker run --rm -p 3000:3000 --add-host=host.docker.internal:host-gateway --env-file agentgateway/.env agentgateway
```

3. Point the bot at it in `bot/.env`, then restart the bot:

```
LLM_BASE_URL=http://localhost:3000/v1
LLM_MODEL=ollama/llama3.1:8b
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

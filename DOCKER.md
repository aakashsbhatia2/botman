# Run with Docker Compose

One command brings up the bot, the tools server, and a local Ollama model in
containers.

First, clone the repo (or your fork):

```bash
git clone <repo-url> botman
cd botman
```

## Prerequisites

- **Docker**
- Running Ollama **in a container with GPU** needs the **native Docker Engine** plus the **NVIDIA Container Toolkit**. **Docker Desktop on Linux cannot pass through an NVIDIA GPU**, so on Docker Desktop either run Ollama on your host (Option B below) or run the container on CPU by removing the `deploy:` block from the `ollama` service in `docker-compose.yml`.

## 1. Get your credentials

See [GETTING_STARTED.md](GETTING_STARTED.md#1-get-your-credentials) for Discord, Notion, and Google.

## 2. Configure

```bash
cp .env.example .env
```

Fill in `DISCORD_TOKEN`, `OWNER_USER_ID`, and the `NOTION_*` / `GOOGLE_*` values. Then pick your LLM in the same file.

**Option A: Ollama in a container (default).** Leave the `LLM_*` lines as-is. Needs native Docker + the NVIDIA toolkit for GPU (see Prerequisites):

```
LLM_BASE_URL=http://ollama:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3.1:8b
```

**Option B: Ollama on your host** (recommended on Docker Desktop, or if you already run Ollama). Point the bot at the host:

```
LLM_BASE_URL=http://host.docker.internal:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3.1:8b
```

**Option C: Anthropic (Claude).** Use your key and Anthropic's OpenAI-compatible endpoint:

```
LLM_BASE_URL=https://api.anthropic.com/v1/
LLM_API_KEY=<your sk-ant- key>
LLM_MODEL=claude-sonnet-4-6
```

## 3. Run

**Option A (containerized Ollama):** start everything including the Ollama container, then pull the model once in another terminal:

```bash
docker compose --profile ollama up --build
docker compose exec ollama ollama pull llama3.1:8b
```

**Option B (host Ollama) or C (Anthropic):** no extra container:

```bash
docker compose up --build
```

For Option B, make sure host Ollama is running with the model (`ollama pull llama3.1:8b`).

Then DM your bot. It only responds to you (`OWNER_USER_ID`):

- **Save**: "remember to call the dentist tomorrow"
- **Recall**: "what do I need to do?"
- **Mark done**: "I called the dentist"
- **Schedule**: "set up a 30-min call with someone@example.com tomorrow at 3pm"

Stop everything with `docker compose down` (`-v` also wipes the pulled model).

## Optional profiles

| Command | Adds |
|---|---|
| `docker compose --profile ollama up` | local Ollama (the default LLM) |
| `docker compose --profile ollama --profile gateway up` | agentgateway |
| `docker compose --profile ollama --profile gateway --profile metrics up` | alloy |

**gateway** routes requests to Anthropic or Ollama behind one endpoint and logs per-request token and cost. To use it, set `ANTHROPIC_API_KEY` in `.env` (only if routing to Claude), and point the bot at it: `LLM_BASE_URL=http://agentgateway:3000/v1` with `LLM_MODEL=ollama/llama3.1:8b` (or `anthropic/claude-sonnet-4-6`).

**metrics** (alloy) ships the gateway's token metrics to Grafana Cloud. Requires the gateway profile and a free Grafana Cloud account; set `GRAFANA_PROM_*` in `.env`.

## Deploying

See [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md).

# botman

A personal assistant you chat with over Discord, powered by any OpenAI-compatible
LLM (Claude, or a local model via Ollama). It only responds to you.

## What it does

- **Save**: "remember to call the dentist tomorrow" → saved to your Notion database
- **Recall**: "what do I need to do?" → answers from your saved notes
- **Mark done**: "I called the dentist" → marks it done
- **Schedule**: "set up a 30-min call with someone@example.com tomorrow at 3pm" → creates a Google Calendar event and invites guests
- **Search the web**: "what's the weather in Tokyo?" → looks it up and answers with sources (optional)
- **Read a link**: paste a URL → reads the page and summarizes it

## Components

- **`bot/`**: the Discord bot and agent. Talks to any OpenAI-compatible LLM (Claude, Ollama, or a gateway) and reaches its tools over MCP.
- **`mcp-tools/`**: MCP tools server owning the capabilities (Notion notes + Google Calendar), over HTTP.

Optional add-ons (off by default; the bot runs fully without them):

- **`agentgateway/`**: OpenAI-compatible LLM proxy. Routes across providers behind one endpoint, meters cost, controls MCP tool access.
- **`alloy/`**: ships gateway token-usage metrics to Grafana Cloud for dashboards.

## Setup

Start with [GETTING_STARTED.md](GETTING_STARTED.md): get your credentials, then
pick how to run it (Docker, or standalone with Ollama or Claude). To deploy, see
[DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md).

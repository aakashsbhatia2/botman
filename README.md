# botman

A personal assistant you chat with over Discord, powered by Claude. It only
responds to you.

## What it does

- **Save**: "remember to call the dentist tomorrow" → saved to your Notion database
- **Recall**: "what do I need to do?" → answers from your saved notes
- **Mark done**: "I called the dentist" → marks it done
- **Schedule**: "set up a 30-min call with someone@example.com tomorrow at 3pm" → creates a Google Calendar event and invites guests

## Components

- **`bot/`**: the Discord bot and Claude agent. Calls Anthropic and reaches its tools over MCP.
- **`mcp-tools/`**: MCP tools server owning the capabilities (Notion notes + Google Calendar), over HTTP.

Optional add-ons (off by default; the bot runs fully without them):

- **`agentgateway/`**: LLM proxy in front of Anthropic. Meters cost, swaps providers, controls MCP tool access.
- **`alloy/`**: ships gateway token-usage metrics to Grafana Cloud for dashboards.

## Setup

See [GETTING_STARTED.md](GETTING_STARTED.md) to run it locally, and
[DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md) to deploy.

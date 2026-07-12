# Getting started

Two steps: get your credentials, then pick how to run botman.

## 1. Get your credentials

### Discord

See [DISCORD_SETUP.md](DISCORD_SETUP.md) for the bot token (`DISCORD_TOKEN`) and your user ID (`OWNER_USER_ID`).

### Notion (for saving notes)

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration** (Internal) → enable Read/Insert/Update → copy the secret (`ntn_…`).
2. Create a **full-page database** with properties: `Name` (Title), `Tags` (Multi-select), `Status` (Select: `active`/`done`/`archived`), `Created` (Created time).
3. **Connect the integration**: open the database → **•••** → **Connections** → add your integration.
4. The database ID is the 32-char hex chunk in the database URL, after the last `-` and before `?v=`.

### Google Calendar (for scheduling)

See [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for the OAuth credentials and refresh token.

## 2. Choose how to run

- [Docker Compose](DOCKER.md): one command, recommended.
- [Standalone with Ollama](STANDALONE_OLLAMA.md): Node plus a local model.
- [Standalone with Anthropic](STANDALONE_ANTHROPIC.md): Node plus Claude.

To deploy to the cloud, see [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md).

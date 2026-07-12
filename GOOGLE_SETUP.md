# Google Calendar setup

Get the OAuth credentials and a refresh token so the bot can create calendar
events. Skip this if you don't want scheduling.

1. [console.cloud.google.com](https://console.cloud.google.com) → new project → **enable the Google Calendar API**.
2. **OAuth consent screen**: External; add the scope `https://www.googleapis.com/auth/calendar.events`; add your Gmail as a test user; **Publish to Production** (avoids the 7-day refresh-token expiry).
3. **Credentials → Create OAuth client ID → Desktop app** → copy the client ID and secret (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
4. Get a refresh token (`GOOGLE_REFRESH_TOKEN`). This one-time step needs Node:

```bash
cd mcp-tools && npm install && node scripts/google/authorize-google.mjs
```

Open the printed URL, approve, and copy the `GOOGLE_REFRESH_TOKEN=…` it prints.

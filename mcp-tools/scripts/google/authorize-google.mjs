import "dotenv/config";
import http from "node:http";
import { google } from "googleapis";

const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env — add them first.",
  );
  process.exit(1);
}

const auth = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = auth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404).end();
    return;
  }

  const code = new URL(req.url, REDIRECT_URI).searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("No authorization code in callback.");
    return;
  }

  try {
    const { tokens } = await auth.getToken(code);
    res
      .writeHead(200, { "Content-Type": "text/plain" })
      .end("Done — you can close this tab and return to the terminal.");

    if (!tokens.refresh_token) {
      console.error(
        "\nNo refresh token returned. Revoke the app's access at " +
          "https://myaccount.google.com/permissions and run this again.",
      );
    } else {
      console.log("\n✅ Success. Paste this into your .env:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    }
  } catch (err) {
    console.error("\nFailed to exchange code for tokens:", err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT, () => {
  console.log("Open this URL in your browser to authorize:\n");
  console.log(authUrl + "\n");
  console.log(
    'If you see an "unverified app" warning, click Advanced → "Go to ' +
      'personal-server (unsafe)" — that\'s expected for a personal app.\n',
  );
});

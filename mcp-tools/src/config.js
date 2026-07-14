import "dotenv/config";

export const config = {
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  timezone: process.env.TIMEZONE,
  tavilyApiKey: process.env.TAVILY_API_KEY,
};

export const PORT = process.env.PORT;

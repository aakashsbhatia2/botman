import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { PORT, config } from "./config.js";
import { createNotionStore } from "./store/notion.js";
import { createCalendar } from "./calendar/google.js";
import { createWebSearch } from "./search/tavily.js";
import { createFetcher } from "./fetch/readable.js";
import { registerTools } from "./tools.js";

const store = createNotionStore();
const calendar = createCalendar();
const webSearch = config.tavilyApiKey ? createWebSearch() : null;
const fetcher = createFetcher();

function buildMcpServer() {
  const server = new McpServer({ name: "mcp-tools", version: "0.1.0" });
  registerTools(server, { store, calendar, webSearch, fetcher });
  return server;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const httpServer = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }

  if (req.method !== "POST" || req.url !== "/mcp") {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
    return;
  }

  const server = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    const body = await readJsonBody(req);
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (err) {
    console.error("[mcp] request failed:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain" }).end("server error");
    }
  }
});

httpServer.listen(PORT, () => {
  console.log(`[mcp] tools server up on port ${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("[mcp] unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[mcp] uncaught exception:", err);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`[mcp] received ${signal}, shutting down`);
    httpServer.close(() => process.exit(0));
  });
}

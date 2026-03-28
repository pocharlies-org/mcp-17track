#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const token = process.env.API_TOKEN_17TRACK;
  if (!token) {
    throw new Error("API_TOKEN_17TRACK environment variable is required");
  }

  const { server } = createServer(token);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp-17track] Running on stdio transport");
}

main().catch((err) => {
  console.error("[mcp-17track] Fatal error:", err);
  process.exit(1);
});

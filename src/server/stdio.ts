import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { appConfig } from "../config/env.js";
import { createAppContext } from "./context.js";
import { createMcpServer } from "./create-mcp-server.js";

export async function startStdioServer(): Promise<void> {
  const context = createAppContext();
  const server = createMcpServer(context);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error(`${appConfig.serverName} running on stdio`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startStdioServer().catch((error) => {
    console.error("Failed to start stdio server", error);
    process.exit(1);
  });
}

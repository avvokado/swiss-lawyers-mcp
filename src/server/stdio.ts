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

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  startStdioServer().catch((error) => {
    console.error("Failed to start stdio server", error);
    process.exit(1);
  });
}

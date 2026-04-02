import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { appConfig } from "../config/env.js";
import { registerPublicTools } from "../tools/definitions.js";
import type { AppContext } from "./context.js";

export function createMcpServer(context: AppContext): McpServer {
  const server = new McpServer(
    {
      name: appConfig.serverName,
      version: appConfig.serverVersion,
    },
    {
      capabilities: {
        logging: {},
        tools: {},
      },
      instructions:
        "Use find_lawyer first for discovery. Use get_lawyer_profile only after you have a lawyer_id.",
    },
  );

  registerPublicTools(server, context.directoryService);
  return server;
}

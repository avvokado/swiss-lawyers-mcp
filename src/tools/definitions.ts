import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LawyerDirectoryService } from "../domain/lawyer-directory-service.js";
import {
  createFindLawyerHandler,
  createGetLawyerProfileHandler,
} from "./handlers.js";
import {
  findLawyerInputSchema,
  findLawyerOutputSchema,
  getLawyerProfileInputSchema,
  getLawyerProfileOutputSchema,
} from "./schemas.js";

export const publicToolNames = ["find_lawyer", "get_lawyer_profile"] as const;

export function registerPublicTools(
  server: McpServer,
  service: LawyerDirectoryService,
): void {
  server.registerTool(
    "find_lawyer",
    {
      title: "Find Lawyer",
      description:
        "Primary discovery tool for Swiss lawyers. Use query first in natural language, for example 'employment law zurich english'. location, specialty, and language are optional supporting filters.",
      inputSchema: findLawyerInputSchema,
      outputSchema: findLawyerOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createFindLawyerHandler(service),
  );

  server.registerTool(
    "get_lawyer_profile",
    {
      title: "Get Lawyer Profile",
      description:
        "Load the fuller profile for a specific result using lawyer_id. Use this after find_lawyer for the detail view.",
      inputSchema: getLawyerProfileInputSchema,
      outputSchema: getLawyerProfileOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    createGetLawyerProfileHandler(service),
  );
}

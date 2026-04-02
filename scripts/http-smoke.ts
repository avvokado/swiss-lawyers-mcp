import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function main() {
  const baseUrl = new URL(process.env.MCP_URL ?? "http://127.0.0.1:8080/mcp");
  const client = new Client({
    name: "swiss-lawyers-mcp-smoke-client",
    version: "0.1.0",
  });
  const transport = new StreamableHTTPClientTransport(baseUrl);

  await client.connect(transport);

  const tools = await client.listTools();
  console.log("Tools:", tools.tools.map((tool) => tool.name).join(", "));

  const search = await client.callTool({
    name: "find_lawyer",
    arguments: {
      query: "employment zurich english",
      limit: 3,
    },
  });
  console.log("find_lawyer:", JSON.stringify(search.structuredContent, null, 2));

  const profile = await client.callTool({
    name: "get_lawyer_profile",
    arguments: {
      lawyer_id: "lawyer-zh-luca-keller",
    },
  });
  console.log(
    "get_lawyer_profile:",
    JSON.stringify(profile.structuredContent, null, 2),
  );

  await transport.close();
}

main().catch((error) => {
  console.error("HTTP smoke failed", error);
  process.exit(1);
});

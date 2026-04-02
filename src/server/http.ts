import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { appConfig } from "../config/env.js";
import { createAppContext } from "./context.js";
import { createMcpServer } from "./create-mcp-server.js";

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return undefined;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJsonRpcError(
  response: ServerResponse,
  code: number,
  message: string,
  statusCode: number,
): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code,
        message,
      },
      id: null,
    }),
  );
}

async function handleMcpRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const context = createAppContext();
  const server = createMcpServer(context);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);

    let parsedBody: unknown;
    if (request.method === "POST") {
      parsedBody = await readJsonBody(request);
    }

    await transport.handleRequest(request, response, parsedBody);
  } finally {
    response.on("close", () => {
      void transport.close();
      void server.close();
    });
  }
}

function setCommonHeaders(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader(
    "access-control-allow-headers",
    "content-type, mcp-session-id, last-event-id",
  );
  response.setHeader("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
}

export const httpServer = createServer(async (request, response) => {
  setCommonHeaders(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.url === "/health") {
    response.statusCode = 200;
    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({
        status: "ok",
        service: appConfig.serverName,
        version: appConfig.serverVersion,
      }),
    );
    return;
  }

  if (request.url !== "/mcp") {
    response.statusCode = 404;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: "Not Found" }));
    return;
  }

  if (
    request.method !== "POST" &&
    request.method !== "GET" &&
    request.method !== "DELETE"
  ) {
    sendJsonRpcError(response, -32000, "Method not allowed", 405);
    return;
  }

  try {
    await handleMcpRequest(request, response);
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJsonRpcError(response, -32700, "Invalid JSON body", 400);
      return;
    }

    console.error("Unhandled HTTP server error", error);
    if (!response.headersSent) {
      sendJsonRpcError(response, -32603, "Internal server error", 500);
    }
  }
});

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  httpServer.listen(appConfig.port, appConfig.host, () => {
    console.log(
      `${appConfig.serverName} listening on http://${appConfig.host}:${appConfig.port}/mcp`,
    );
  });
}

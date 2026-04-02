import assert from "node:assert/strict";
import { once } from "node:events";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SeedLawyerRepository } from "../src/data/seed-lawyer-repository.js";
import { LawyerDirectoryService } from "../src/domain/lawyer-directory-service.js";
import { NotFoundError } from "../src/domain/errors.js";
import { LawyerSearchService } from "../src/search/lawyer-search-service.js";
import { createMcpServer } from "../src/server/create-mcp-server.js";
import { createAppContext } from "../src/server/context.js";
import { httpServer } from "../src/server/http.js";
import { publicToolNames } from "../src/tools/definitions.js";
import {
  parseFindLawyerInput,
  parseGetLawyerProfileInput,
} from "../src/tools/schemas.js";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

const repository = new SeedLawyerRepository();
const searchService = new LawyerSearchService();
const directoryService = new LawyerDirectoryService(repository, searchService);

async function runSearch(input: {
  query?: string;
  location?: string;
  specialty?: string;
  language?: string;
  limit?: number;
}) {
  const lawyers = await repository.listAll();
  return searchService.search(lawyers, {
    query: input.query,
    location: input.location,
    specialty: input.specialty,
    language: input.language,
    limit: input.limit ?? 5,
  });
}

async function withStdioClient(
  run: (client: Client) => Promise<void>,
): Promise<void> {
  const client = new Client({
    name: "stdio-transport-test",
    version: "0.1.0",
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(process.cwd(), "dist/src/server/stdio.js")],
    cwd: process.cwd(),
    stderr: "pipe",
  });

  try {
    await client.connect(transport);
    await run(client);
  } finally {
    await transport.close();
  }
}

const tests: TestCase[] = [
  {
    name: "findet exakten Freitext-Treffer fuer Fachgebiet und Stadt",
    async run() {
      const response = await runSearch({ query: "employment zurich english" });
      assert.equal(response.search_strategy, "exact");
      assert.equal(response.results[0]?.id, "lawyer-zh-luca-keller");
    },
  },
  {
    name: "unterstuetzt gemischte Query plus Filter",
    async run() {
      const response = await runSearch({
        query: "contracts",
        location: "Geneva",
        specialty: "tax",
        language: "english",
      });
      assert.equal(response.search_strategy, "exact");
      assert.equal(response.results[0]?.id, "lawyer-ge-julien-rochat");
    },
  },
  {
    name: "unterstuetzt sprachbasierte Suche",
    async run() {
      const response = await runSearch({ language: "italian" });
      assert.ok(response.results.length >= 3);
    },
  },
  {
    name: "faellt auf nahe Region zurueck wenn der Ort keinen exakten Treffer hat",
    async run() {
      const response = await runSearch({
        location: "Chiasso",
        specialty: "tax",
        language: "english",
      });
      assert.equal(response.search_strategy, "fallback");
      assert.equal(response.results[0]?.id, "lawyer-ti-giulia-bernardi");
      assert.equal(response.results[0]?.match_metadata.fallback_used, true);
    },
  },
  {
    name: "faellt auf verwandtes Fachgebiet zurueck wenn kein exakter Spezial-Treffer existiert",
    async run() {
      const response = await runSearch({
        location: "Lausanne",
        specialty: "immigration",
        language: "english",
      });
      assert.equal(response.search_strategy, "fallback");
      assert.equal(response.results[0]?.id, "lawyer-vd-emilie-bovet");
    },
  },
  {
    name: "beruecksichtigt verified, curated und Profilvollstaendigkeit im Ranking",
    async run() {
      const response = await runSearch({
        specialty: "familienrecht",
        language: "english",
      });
      assert.equal(response.results[0]?.id, "lawyer-zh-anna-meier");
    },
  },
  {
    name: "haelt Mehrwort-Queries als exact wenn ein klarer Phrasen-Treffer vorliegt",
    async run() {
      const response = await runSearch({ query: "employment law", limit: 1 });
      assert.equal(response.search_strategy, "exact");
      assert.equal(response.results[0]?.id, "lawyer-zh-luca-keller");
    },
  },
  {
    name: "stuft lose Token-Treffer ohne klaren Exaktbezug als broad ein",
    async run() {
      const response = await runSearch({ query: "management", limit: 1 });
      assert.equal(response.search_strategy, "broad");
      assert.ok(response.results.length > 0);
    },
  },
  {
    name: "arbeitet auch mit leeren Queries und nur Filtern",
    async run() {
      const response = await runSearch({ location: "Basel" });
      assert.ok(response.results.length >= 2);
      assert.ok(response.results.every((result) => result.canton === "BS"));
    },
  },
  {
    name: "liefert ohne Query und Filter eine sinnvolle kuratierte Default-Liste",
    async run() {
      const response = await runSearch({});
      assert.equal(response.search_strategy, "broad");
      assert.ok(response.results.length > 0);
    },
  },
  {
    name: "liefert ein vollstaendiges Profil fuer gueltige lawyer_id",
    async run() {
      const response = await directoryService.getLawyerProfile("lawyer-zh-luca-keller");
      assert.equal(response.profile.id, "lawyer-zh-luca-keller");
      assert.ok(response.profile.profile_text.length > 20);
    },
  },
  {
    name: "liefert not found fuer unbekannte lawyer_id",
    async run() {
      await assert.rejects(
        () => directoryService.getLawyerProfile("does-not-exist"),
        (error: unknown) => error instanceof NotFoundError,
      );
    },
  },
  {
    name: "validierung lehnt falsche Typen klar ab",
    run() {
      assert.throws(() =>
        parseFindLawyerInput({
          query: "family",
          limit: "wrong-type",
        }),
      );
    },
  },
  {
    name: "leere Strings werden sicher normalisiert",
    run() {
      const parsed = parseFindLawyerInput({
        query: "   ",
        location: "  ",
      });
      assert.equal(parsed.query, undefined);
      assert.equal(parsed.location, undefined);
    },
  },
  {
    name: "limit wird sicher gedeckelt",
    run() {
      const parsed = parseFindLawyerInput({
        query: "tax",
        limit: 999,
      });
      assert.equal(parsed.limit, 10);
    },
  },
  {
    name: "lawyer_id wird getrimmt",
    run() {
      const parsed = parseGetLawyerProfileInput({
        lawyer_id: " lawyer-zh-anna-meier ",
      });
      assert.equal(parsed.lawyer_id, "lawyer-zh-anna-meier");
    },
  },
  {
    name: "MCP-Registrierung enthaelt exakt die zwei oeffentlichen Tools",
    run() {
      const server = createMcpServer(createAppContext()) as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      assert.deepEqual(
        Object.keys(server._registeredTools).sort(),
        [...publicToolNames].sort(),
      );
    },
  },
  {
    name: "HTTP-Transport exponiert denselben Tool-Katalog und denselben Handler-Kern",
    async run() {
      httpServer.listen(0, "127.0.0.1");
      await once(httpServer, "listening");

      const address = httpServer.address();
      if (!address || typeof address === "string") {
        throw new Error("HTTP server address unavailable");
      }

      const client = new Client({
        name: "http-transport-test",
        version: "0.1.0",
      });
      const transport = new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
      );

      try {
        await client.connect(transport);
        const tools = await client.listTools();
        assert.deepEqual(
          tools.tools.map((tool) => tool.name).sort(),
          [...publicToolNames].sort(),
        );

        const result = await client.callTool({
          name: "find_lawyer",
          arguments: {
            query: "tax lugano",
            limit: 1,
          },
        });

        const structured = result.structuredContent as {
          results?: Array<{ id: string; verified: boolean; curated: boolean }>;
        };
        assert.equal(structured.results?.[0]?.id, "lawyer-ti-giulia-bernardi");
        assert.equal(typeof structured.results?.[0]?.verified, "boolean");
        assert.equal(typeof structured.results?.[0]?.curated, "boolean");
      } finally {
        await transport.close();
        httpServer.close();
      }
    },
  },
  {
    name: "stdio-Transport fuehrt find_lawyer als echten MCP-Call aus",
    async run() {
      await withStdioClient(async (client) => {
        const result = await client.callTool({
          name: "find_lawyer",
          arguments: {
            query: "employment law",
            limit: 1,
          },
        });

        const structured = result.structuredContent as {
          results?: Array<{ id: string; verified: boolean; curated: boolean }>;
          search_strategy?: string;
        };

        assert.equal(structured.search_strategy, "exact");
        assert.equal(structured.results?.[0]?.id, "lawyer-zh-luca-keller");
        assert.equal(typeof structured.results?.[0]?.verified, "boolean");
        assert.equal(typeof structured.results?.[0]?.curated, "boolean");
      });
    },
  },
  {
    name: "stdio-Transport fuehrt get_lawyer_profile als echten MCP-Call aus",
    async run() {
      await withStdioClient(async (client) => {
        const result = await client.callTool({
          name: "get_lawyer_profile",
          arguments: {
            lawyer_id: "lawyer-zh-anna-meier",
          },
        });

        const structured = result.structuredContent as {
          profile?: { id: string };
        };

        assert.equal(structured.profile?.id, "lawyer-zh-anna-meier");
      });
    },
  },
  {
    name: "MCP-Toolfehler liefern einen stabilen INVALID_INPUT-Vertrag",
    async run() {
      await withStdioClient(async (client) => {
        const result = await client.callTool({
          name: "find_lawyer",
          arguments: {
            query: "tax",
            limit: "wrong-type",
          },
        });

        const errored = result as {
          isError?: boolean;
          structuredContent?: {
            error?: { code?: string };
          };
        };

        assert.equal(errored.isError, true);
        assert.equal(errored.structuredContent?.error?.code, "INVALID_INPUT");
      });
    },
  },
];

async function main() {
  let passed = 0;

  for (const testCase of tests) {
    try {
      await testCase.run();
      passed += 1;
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      console.error(`FAIL ${testCase.name}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log(`All tests passed (${passed}/${tests.length}).`);
}

main().catch((error) => {
  console.error("Test runner failed");
  console.error(error);
  process.exit(1);
});

import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv({ quiet: true });

const envSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(8080),
  MCP_SERVER_NAME: z.string().default("swiss-lawyers-mcp by avvokado.ch"),
  MCP_SERVER_VERSION: z.string().default("0.1.0"),
  DEFAULT_RESULT_LIMIT: z.coerce.number().int().positive().default(5),
  MAX_RESULT_LIMIT: z.coerce.number().int().positive().default(10),
});

const parsedEnv = envSchema.parse(process.env);

export const appConfig = {
  host: parsedEnv.HOST,
  port: parsedEnv.PORT,
  serverName: parsedEnv.MCP_SERVER_NAME,
  serverVersion: parsedEnv.MCP_SERVER_VERSION,
  defaultResultLimit: parsedEnv.DEFAULT_RESULT_LIMIT,
  maxResultLimit: parsedEnv.MAX_RESULT_LIMIT,
  source: "swiss-lawyers-mcp by avvokado.ch",
  provider: "avvokado.ch",
} as const;

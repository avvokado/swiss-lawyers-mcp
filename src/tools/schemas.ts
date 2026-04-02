import { z } from "zod";
import { appConfig } from "../config/env.js";
import type { LawyerSearchInput } from "../types/lawyer.js";
import { InvalidInputError } from "../domain/errors.js";

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export const findLawyerInputSchema = z
  .object({
    query: z.unknown().optional().describe("Primary natural-language search query."),
    location: z
      .unknown()
      .optional()
      .describe("Optional city, canton, or Swiss region filter."),
    specialty: z
      .unknown()
      .optional()
      .describe("Optional legal specialty filter."),
    language: z
      .unknown()
      .optional()
      .describe("Optional language filter."),
    limit: z
      .unknown()
      .optional()
      .describe(
        `Optional result limit. Defaults to ${appConfig.defaultResultLimit}, capped at ${appConfig.maxResultLimit}.`,
      ),
  });

export const getLawyerProfileInputSchema = z
  .object({
    lawyer_id: z
      .unknown()
      .describe("The lawyer_id returned by find_lawyer."),
  });

const strictFindLawyerParseSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  specialty: z.string().optional(),
  language: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

const strictGetLawyerProfileParseSchema = z.object({
  lawyer_id: z.string().min(1),
});

export function parseFindLawyerInput(input: unknown): LawyerSearchInput {
  const result = strictFindLawyerParseSchema.safeParse(input);
  if (!result.success) {
    throw new InvalidInputError(
      "Invalid input for find_lawyer. Expected optional string fields query, location, specialty, language, and an optional positive integer limit.",
    );
  }

  return {
    query: normalizeOptionalText(result.data.query),
    location: normalizeOptionalText(result.data.location),
    specialty: normalizeOptionalText(result.data.specialty),
    language: normalizeOptionalText(result.data.language),
    limit: Math.min(
      result.data.limit ?? appConfig.defaultResultLimit,
      appConfig.maxResultLimit,
    ),
  };
}

export function parseGetLawyerProfileInput(
  input: unknown,
): { lawyer_id: string } {
  const result = strictGetLawyerProfileParseSchema.safeParse(input);
  if (!result.success) {
    throw new InvalidInputError(
      "Invalid input for get_lawyer_profile. Expected a non-empty string lawyer_id.",
    );
  }

  const lawyerId = result.data.lawyer_id.trim();
  if (!lawyerId) {
    throw new InvalidInputError(
      "Invalid input for get_lawyer_profile. Expected a non-empty string lawyer_id.",
    );
  }

  return {
    lawyer_id: lawyerId,
  };
}

export const matchMetadataSchema = z.object({
  score: z.number(),
  matched_on: z.array(z.string()),
  fallback_used: z.boolean(),
  fallback_reason: z.string().optional(),
});

export const lawyerSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  law_firm: z.string(),
  city: z.string(),
  canton: z.string(),
  specialties: z.array(z.string()),
  languages: z.array(z.string()),
  profile_summary: z.string(),
  verified: z.boolean(),
  curated: z.boolean(),
  match_metadata: matchMetadataSchema,
  source: z.string(),
  provider: z.string().optional(),
});

export const findLawyerOutputSchema = z.object({
  results: z.array(lawyerSearchResultSchema),
  total_results: z.number().int().nonnegative(),
  search_strategy: z.enum(["exact", "broad", "fallback"]),
  applied_filters: z.object({
    query: z.string().optional(),
    location: z.string().optional(),
    specialty: z.string().optional(),
    language: z.string().optional(),
    limit: z.number().int().positive(),
  }),
  suggestions: z.array(z.string()).optional(),
  source: z.string(),
});

export const lawyerProfileSchema = lawyerSearchResultSchema.extend({
  profile_text: z.string(),
  verified: z.boolean(),
  curated: z.boolean(),
  contact_email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  last_updated: z.string().optional(),
  regions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const getLawyerProfileOutputSchema = z.object({
  profile: lawyerProfileSchema,
  source: z.string(),
});

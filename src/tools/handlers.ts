import type { LawyerDirectoryService } from "../domain/lawyer-directory-service.js";
import { DirectoryError } from "../domain/errors.js";
import { ZodError } from "zod";
import type {
  LawyerProfileResponse,
  LawyerSearchResponse,
  ToolErrorResponse,
} from "../types/lawyer.js";
import {
  parseFindLawyerInput,
  parseGetLawyerProfileInput,
} from "./schemas.js";

function errorMessage(error: ToolErrorResponse["error"]): string {
  return JSON.stringify({ error }, null, 2);
}

function normalizeDirectoryError(error: DirectoryError): ToolErrorResponse["error"] {
  switch (error.code) {
    case "INVALID_INPUT":
      return {
        code: "INVALID_INPUT",
        message: "Invalid input. Please check the tool arguments and try again.",
      };
    case "NOT_FOUND":
      return {
        code: "NOT_FOUND",
        message: "Lawyer profile not found for the provided lawyer_id.",
      };
    case "EMPTY_DATASET":
      return {
        code: "EMPTY_DATASET",
        message: "The directory dataset is empty. Please check the configured data source.",
      };
    default:
      return {
        code: "INTERNAL_ERROR",
        message: "Internal processing error. Please try the request again.",
      };
  }
}

function searchSummary(response: LawyerSearchResponse): string {
  const lines = [`${response.total_results} results, strategy: ${response.search_strategy}.`];

  for (const result of response.results) {
    const fallbackNote = result.match_metadata.fallback_used
      ? ` [Fallback: ${result.match_metadata.fallback_reason ?? "yes"}]`
      : "";
    lines.push(
      `- ${result.name} | ${result.law_firm} | ${result.city} (${result.canton}) | ${result.specialties.join(", ")} | verified=${result.verified} curated=${result.curated}${fallbackNote}`,
    );
  }

  if (response.suggestions?.length) {
    lines.push(`Suggestions: ${response.suggestions.join(" | ")}`);
  }

  return lines.join("\n");
}

function profileSummary(response: LawyerProfileResponse): string {
  const { profile } = response;

  return [
    `${profile.name} | ${profile.law_firm} | ${profile.city} (${profile.canton})`,
    `Specialties: ${profile.specialties.join(", ")}`,
    `Languages: ${profile.languages.join(", ")}`,
    `Profile: ${profile.profile_summary}`,
  ].join("\n");
}

export function toToolErrorResult(error: unknown) {
  const normalizedError =
    error instanceof ZodError
      ? {
          code: "INVALID_INPUT" as const,
          message: "Invalid input. Please check the tool arguments and try again.",
        }
      : null;

  const safeError: ToolErrorResponse["error"] =
    normalizedError
      ? normalizedError
      : error instanceof DirectoryError
      ? normalizeDirectoryError(error)
      : {
          code: "INTERNAL_ERROR",
          message:
            "Internal processing error. Please try the request again.",
        };

  if (!normalizedError && !(error instanceof DirectoryError)) {
    console.error("Unexpected tool error", error);
  }

  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: errorMessage(safeError),
      },
    ],
    structuredContent: {
      error: safeError,
    } as Record<string, unknown>,
  };
}

export function createFindLawyerHandler(service: LawyerDirectoryService) {
  return async (input: unknown) => {
    try {
      const parsedInput = parseFindLawyerInput(input);
      const response = await service.findLawyers(parsedInput);
      return {
        content: [
          {
            type: "text" as const,
            text: searchSummary(response),
          },
        ],
        structuredContent: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return toToolErrorResult(error);
    }
  };
}

export function createGetLawyerProfileHandler(service: LawyerDirectoryService) {
  return async (input: unknown) => {
    try {
      const { lawyer_id } = parseGetLawyerProfileInput(input);
      const response = await service.getLawyerProfile(lawyer_id);
      return {
        content: [
          {
            type: "text" as const,
            text: profileSummary(response),
          },
        ],
        structuredContent: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return toToolErrorResult(error);
    }
  };
}

import { EmptyDatasetError } from "../domain/errors.js";
import { appConfig } from "../config/env.js";
import type { Lawyer, LawyerSearchInput, LawyerSearchResponse, MatchMetadata, SearchStrategy } from "../types/lawyer.js";
import { normalizeLawyer, normalizeSearchInput } from "./normalize.js";

interface Candidate {
  lawyer: Lawyer;
  score: number;
  matchedOn: Set<string>;
  queryScore: number;
  filterScore: number;
  softBoostScore: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
  exactLocationMatch: boolean;
  exactSpecialtyMatch: boolean;
  exactLanguageMatch: boolean;
  exactQueryLocationMatch: boolean;
  exactQuerySpecialtyMatch: boolean;
  exactQueryNameMatch: boolean;
  phraseMatch: boolean;
}

function includesToken(values: string[], token: string): boolean {
  return values.some((value) => value.includes(token));
}

function profileCompletenessBoost(lawyer: Lawyer): number {
  const optionalFields = [
    lawyer.contact_email,
    lawyer.phone,
    lawyer.website,
    lawyer.address,
    lawyer.last_updated,
    lawyer.regions?.length ? "regions" : undefined,
    lawyer.tags?.length ? "tags" : undefined,
  ];

  const filledFields = optionalFields.filter(Boolean).length;
  const textBoost = lawyer.profile_text.length > 260 ? 2 : 0;

  return Math.min(6, filledFields) + textBoost;
}

function freshnessBoost(lawyer: Lawyer): number {
  if (!lawyer.last_updated) {
    return 0;
  }

  const updatedAt = new Date(lawyer.last_updated);
  if (Number.isNaN(updatedAt.getTime())) {
    return 0;
  }

  const ageInDays = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays <= 45) {
    return 5;
  }

  if (ageInDays <= 120) {
    return 3;
  }

  if (ageInDays <= 240) {
    return 1;
  }

  return 0;
}

function computeSoftBoosts(lawyer: Lawyer): number {
  return (
    (lawyer.verified ? 8 : 0) +
    (lawyer.curated ? 7 : 0) +
    profileCompletenessBoost(lawyer) +
    freshnessBoost(lawyer)
  );
}

function createCandidate(
  lawyer: Lawyer,
  fallbackUsed = false,
  fallbackReason?: string,
): Candidate {
  return {
    lawyer,
    score: 0,
    matchedOn: new Set<string>(),
    queryScore: 0,
    filterScore: 0,
    softBoostScore: computeSoftBoosts(lawyer),
    fallbackUsed,
    fallbackReason,
    exactLocationMatch: false,
    exactSpecialtyMatch: false,
    exactLanguageMatch: false,
    exactQueryLocationMatch: false,
    exactQuerySpecialtyMatch: false,
    exactQueryNameMatch: false,
    phraseMatch: false,
  };
}

function scoreQuery(candidate: Candidate, input: ReturnType<typeof normalizeSearchInput>): void {
  const normalized = normalizeLawyer(candidate.lawyer);
  const tokens = input.queryTokens;
  const phraseMatch =
    input.normalizedQueryPhrases.some(
      (phrase) =>
        normalized.specialties.includes(phrase) ||
        normalized.tags.includes(phrase) ||
        normalized.name === phrase ||
        normalized.lawFirm === phrase ||
        normalized.city === phrase ||
        normalized.canton === phrase,
    ) ||
    (!!input.normalizedQuery && normalized.name === input.normalizedQuery);

  if (phraseMatch) {
    candidate.phraseMatch = true;
    candidate.matchedOn.add("query_phrase");
  }

  if (input.normalizedQuery && normalized.name === input.normalizedQuery) {
    candidate.exactQueryNameMatch = true;
  }

  if (!tokens.length) {
    return;
  }

  for (const token of tokens) {
    if (normalized.specialties.some((value) => value.includes(token))) {
      candidate.queryScore += 24;
      candidate.matchedOn.add("specialty");
      if (normalized.specialties.includes(token)) {
        candidate.exactQuerySpecialtyMatch = true;
      }
    }

    if (normalized.tags.some((value) => value.includes(token))) {
      candidate.queryScore += 18;
      candidate.matchedOn.add("tag");
    }

    if (normalized.city.includes(token)) {
      candidate.queryScore += 16;
      candidate.matchedOn.add("city");
      if (normalized.city === token) {
        candidate.exactQueryLocationMatch = true;
      }
    }

    if (normalized.canton.includes(token)) {
      candidate.queryScore += 14;
      candidate.matchedOn.add("canton");
      if (normalized.canton === token) {
        candidate.exactQueryLocationMatch = true;
      }
    }

    if (normalized.languages.some((value) => value.includes(token))) {
      candidate.queryScore += 12;
      candidate.matchedOn.add("language");
    }

    if (normalized.name.includes(token)) {
      candidate.queryScore += 12;
      candidate.matchedOn.add("name");
    }

    if (normalized.lawFirm.includes(token)) {
      candidate.queryScore += 10;
      candidate.matchedOn.add("law_firm");
    }

    if (normalized.regions.some((value) => value.includes(token))) {
      candidate.queryScore += 9;
      candidate.matchedOn.add("region");
    }

    if (normalized.profileSummary.includes(token)) {
      candidate.queryScore += 8;
      candidate.matchedOn.add("profile_summary");
    }

    if (normalized.profileText.includes(token)) {
      candidate.queryScore += 4;
      candidate.matchedOn.add("profile_text");
    }
  }
}

function scoreStructuredFilters(
  candidate: Candidate,
  input: ReturnType<typeof normalizeSearchInput>,
  options: { allowRelatedSpecialty: boolean; allowNearbyLocation: boolean },
): boolean {
  const normalized = normalizeLawyer(candidate.lawyer);

  if (input.normalizedLocation) {
    const exactLocation =
      normalized.city === input.normalizedLocation ||
      normalized.canton === input.normalizedLocation;

    const nearbyLocation =
      options.allowNearbyLocation &&
      (
        includesToken(normalized.regions, input.normalizedLocation) ||
        input.nearbyLocations.some(
          (location) =>
            normalized.city === location ||
            normalized.canton === location ||
            includesToken(normalized.regions, location),
        )
      );

    if (!exactLocation && !nearbyLocation) {
      return false;
    }

    if (exactLocation) {
      candidate.filterScore += 28;
      candidate.matchedOn.add("location");
      candidate.exactLocationMatch = true;
    } else if (nearbyLocation) {
      candidate.filterScore += 14;
      candidate.matchedOn.add("nearby_location");
    }
  }

  if (input.normalizedSpecialty) {
    const exactSpecialty = normalized.specialties.includes(input.normalizedSpecialty);
    const relatedSpecialty =
      options.allowRelatedSpecialty &&
      input.relatedSpecialties.some((specialty) => normalized.specialties.includes(specialty));

    if (!exactSpecialty && !relatedSpecialty) {
      return false;
    }

    if (exactSpecialty) {
      candidate.filterScore += 30;
      candidate.matchedOn.add("specialty_filter");
      candidate.exactSpecialtyMatch = true;
    } else if (relatedSpecialty) {
      candidate.filterScore += 12;
      candidate.matchedOn.add("related_specialty");
    }
  }

  if (input.normalizedLanguage) {
    const exactLanguage = normalized.languages.includes(input.normalizedLanguage);
    if (!exactLanguage) {
      return false;
    }

    candidate.filterScore += 18;
    candidate.matchedOn.add("language_filter");
    candidate.exactLanguageMatch = true;
  }

  return true;
}

function isExactCandidate(candidate: Candidate): boolean {
  return (
    candidate.exactLocationMatch ||
    candidate.exactSpecialtyMatch ||
    candidate.exactQueryLocationMatch ||
    candidate.exactQuerySpecialtyMatch ||
    candidate.exactQueryNameMatch ||
    candidate.phraseMatch
  );
}

function finalizeCandidates(candidates: Candidate[]): Candidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      score: candidate.queryScore + candidate.filterScore + candidate.softBoostScore,
    }))
    .sort((left, right) => right.score - left.score)
    .sort((left, right) => Number(right.lawyer.curated) - Number(left.lawyer.curated))
    .sort((left, right) => Number(right.lawyer.verified) - Number(left.lawyer.verified));
}

function toMetadata(candidate: Candidate): MatchMetadata {
  return {
    score: candidate.score,
    matched_on: [...candidate.matchedOn],
    fallback_used: candidate.fallbackUsed,
    fallback_reason: candidate.fallbackReason,
  };
}

function buildSuggestions(
  input: ReturnType<typeof normalizeSearchInput>,
  strategy: SearchStrategy,
): string[] | undefined {
  if (strategy !== "fallback") {
    return undefined;
  }

  const suggestions = new Set<string>();

  if (input.relatedSpecialties.length) {
    suggestions.add(
      `Try related specialties such as ${input.relatedSpecialties.join(", ")}.`,
    );
  }

  if (input.nearbyLocations.length) {
    suggestions.add(
      `Try nearby locations for ${input.location}: ${input.nearbyLocations.join(", ")}.`,
    );
  }

  if (input.query) {
    suggestions.add(
      "Keep the query short and natural, for example specialty plus location instead of a long description.",
    );
  }

  return suggestions.size ? [...suggestions] : undefined;
}

export class LawyerSearchService {
  search(lawyers: Lawyer[], rawInput: LawyerSearchInput): LawyerSearchResponse {
    if (!lawyers.length) {
      throw new EmptyDatasetError(
        "The directory dataset is empty. Please check the configured data source.",
      );
    }

    const input = normalizeSearchInput(rawInput);
    const defaultCandidates = finalizeCandidates(
      lawyers.map((lawyer) => {
        const candidate = createCandidate(lawyer);
        candidate.matchedOn.add("default_curated_order");
        return candidate;
      }),
    );

    if (
      !input.query &&
      !input.normalizedLocation &&
      !input.normalizedSpecialty &&
      !input.normalizedLanguage
    ) {
      return {
        results: defaultCandidates.slice(0, input.limit).map((candidate) => ({
          id: candidate.lawyer.id,
          name: candidate.lawyer.name,
          law_firm: candidate.lawyer.law_firm,
          city: candidate.lawyer.city,
          canton: candidate.lawyer.canton,
          specialties: candidate.lawyer.specialties,
          languages: candidate.lawyer.languages,
          profile_summary: candidate.lawyer.profile_summary,
          verified: candidate.lawyer.verified,
          curated: candidate.lawyer.curated,
          match_metadata: toMetadata(candidate),
          source: appConfig.source,
          provider: appConfig.provider,
        })),
        total_results: defaultCandidates.length,
        search_strategy: "broad",
        applied_filters: {
          query: input.query,
          location: input.location,
          specialty: input.specialty,
          language: input.language,
          limit: input.limit,
        },
        suggestions: [
          "Use query for specialty, location, or language, for example 'employment zurich english'.",
        ],
        source: appConfig.source,
      };
    }

    const strongMatches = finalizeCandidates(
      lawyers.flatMap((lawyer) => {
        const candidate = createCandidate(lawyer);
        scoreQuery(candidate, input);

        if (!scoreStructuredFilters(candidate, input, { allowRelatedSpecialty: false, allowNearbyLocation: false })) {
          return [];
        }

        const requiresQueryMatch = input.queryTokens.length > 0;
        const queryOk = !requiresQueryMatch || (candidate.queryScore > 0 && isExactCandidate(candidate));

        return queryOk ? [candidate] : [];
      }),
    );

    const broadMatches = finalizeCandidates(
      lawyers.flatMap((lawyer) => {
        const candidate = createCandidate(lawyer);
        scoreQuery(candidate, input);

        if (!scoreStructuredFilters(candidate, input, { allowRelatedSpecialty: false, allowNearbyLocation: false })) {
          return [];
        }

        const requiresQueryMatch = input.queryTokens.length > 0;
        const queryOk = !requiresQueryMatch || candidate.queryScore > 0;

        return queryOk ? [candidate] : [];
      }),
    );

    const relatedSpecialtyFallback = finalizeCandidates(
      lawyers.flatMap((lawyer) => {
        const candidate = createCandidate(
          lawyer,
          true,
          "Related specialty used instead of an exact specialty match.",
        );
        scoreQuery(candidate, input);

        if (!scoreStructuredFilters(candidate, input, { allowRelatedSpecialty: true, allowNearbyLocation: false })) {
          return [];
        }

        return candidate.exactSpecialtyMatch ? [] : [candidate];
      }),
    );

    const nearbyLocationFallback = finalizeCandidates(
      lawyers.flatMap((lawyer) => {
        const candidate = createCandidate(
          lawyer,
          true,
          "Nearby location or canton used instead of an exact location match.",
        );
        scoreQuery(candidate, input);

        if (!scoreStructuredFilters(candidate, input, { allowRelatedSpecialty: true, allowNearbyLocation: true })) {
          return [];
        }

        return candidate.exactLocationMatch ? [] : [candidate];
      }),
    );

    const broaderFallback = finalizeCandidates(
      lawyers.flatMap((lawyer) => {
        const candidate = createCandidate(
          lawyer,
          true,
          "Broader relevant match used as a final fallback.",
        );
        scoreQuery(candidate, input);

        if (input.queryTokens.length > 0 && candidate.queryScore === 0) {
          return [];
        }

        candidate.matchedOn.add("broad_relevance");
        return [candidate];
      }),
    );

    const chooseStage = (): { strategy: SearchStrategy; candidates: Candidate[] } => {
      if (strongMatches.length) {
        return { strategy: "exact", candidates: strongMatches };
      }

      if (broadMatches.length) {
        return { strategy: "broad", candidates: broadMatches };
      }

      if (relatedSpecialtyFallback.length) {
        return { strategy: "fallback", candidates: relatedSpecialtyFallback };
      }

      if (nearbyLocationFallback.length) {
        return { strategy: "fallback", candidates: nearbyLocationFallback };
      }

      return { strategy: "fallback", candidates: broaderFallback };
    };

    const selected = chooseStage();

    return {
      results: selected.candidates.slice(0, input.limit).map((candidate) => ({
        id: candidate.lawyer.id,
        name: candidate.lawyer.name,
        law_firm: candidate.lawyer.law_firm,
        city: candidate.lawyer.city,
        canton: candidate.lawyer.canton,
        specialties: candidate.lawyer.specialties,
        languages: candidate.lawyer.languages,
        profile_summary: candidate.lawyer.profile_summary,
        verified: candidate.lawyer.verified,
        curated: candidate.lawyer.curated,
        match_metadata: toMetadata(candidate),
        source: appConfig.source,
        provider: appConfig.provider,
      })),
      total_results: selected.candidates.length,
      search_strategy: selected.strategy,
      applied_filters: {
        query: input.query,
        location: input.location,
        specialty: input.specialty,
        language: input.language,
        limit: input.limit,
      },
      suggestions: buildSuggestions(input, selected.strategy),
      source: appConfig.source,
    };
  }
}

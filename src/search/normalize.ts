import type { Lawyer, LawyerSearchInput } from "../types/lawyer.js";
import {
  extractQueryPhrases,
  getNearbyLocations,
  getRelatedSpecialties,
  resolveLanguageAlias,
  resolveLocationAlias,
  resolveSpecialtyAlias,
} from "./aliases.js";

export interface NormalizedSearchInput extends LawyerSearchInput {
  normalizedQuery?: string;
  normalizedQueryPhrases: string[];
  queryTokens: string[];
  normalizedLocation?: string;
  normalizedSpecialty?: string;
  normalizedLanguage?: string;
  relatedSpecialties: string[];
  nearbyLocations: string[];
}

export interface NormalizedLawyerDocument {
  city: string;
  canton: string;
  specialties: string[];
  languages: string[];
  tags: string[];
  regions: string[];
  name: string;
  lawFirm: string;
  profileSummary: string;
  profileText: string;
  combinedText: string;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9./+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function normalizeSearchInput(input: LawyerSearchInput): NormalizedSearchInput {
  const normalizedQuery = input.query ? normalizeText(input.query) : undefined;
  const normalizedQueryPhrases = normalizedQuery
    ? extractQueryPhrases(normalizedQuery).map((phrase) =>
        resolveLanguageAlias(resolveSpecialtyAlias(resolveLocationAlias(phrase))),
      )
    : [];
  const normalizedLocation = input.location
    ? resolveLocationAlias(normalizeText(input.location))
    : undefined;
  const normalizedSpecialty = input.specialty
    ? resolveSpecialtyAlias(normalizeText(input.specialty))
    : undefined;
  const normalizedLanguage = input.language
    ? resolveLanguageAlias(normalizeText(input.language))
    : undefined;
  const queryTokens = tokenize(input.query).map((token) => {
    const location = resolveLocationAlias(token);
    const specialty = resolveSpecialtyAlias(location);
    return resolveLanguageAlias(specialty);
  });

  return {
    ...input,
    query: input.query?.trim() || undefined,
    location: input.location?.trim() || undefined,
    specialty: input.specialty?.trim() || undefined,
    language: input.language?.trim() || undefined,
    normalizedQuery,
    normalizedQueryPhrases,
    queryTokens,
    normalizedLocation,
    normalizedSpecialty,
    normalizedLanguage,
    relatedSpecialties: normalizedSpecialty
      ? getRelatedSpecialties(normalizedSpecialty)
      : [],
    nearbyLocations: normalizedLocation ? getNearbyLocations(normalizedLocation) : [],
  };
}

export function normalizeLawyer(lawyer: Lawyer): NormalizedLawyerDocument {
  const specialties = lawyer.specialties.map((specialty) =>
    resolveSpecialtyAlias(normalizeText(specialty)),
  );
  const languages = lawyer.languages.map((language) =>
    resolveLanguageAlias(normalizeText(language)),
  );
  const tags = (lawyer.tags ?? []).map((tag) =>
    resolveSpecialtyAlias(resolveLocationAlias(normalizeText(tag))),
  );
  const regions = (lawyer.regions ?? []).map((region) =>
    resolveLocationAlias(normalizeText(region)),
  );
  const city = resolveLocationAlias(normalizeText(lawyer.city));
  const canton = resolveLocationAlias(normalizeText(lawyer.canton));
  const name = normalizeText(lawyer.name);
  const lawFirm = normalizeText(lawyer.law_firm);
  const profileSummary = normalizeText(lawyer.profile_summary);
  const profileText = normalizeText(lawyer.profile_text);

  return {
    city,
    canton,
    specialties,
    languages,
    tags,
    regions,
    name,
    lawFirm,
    profileSummary,
    profileText,
    combinedText: [
      name,
      lawFirm,
      city,
      canton,
      specialties.join(" "),
      languages.join(" "),
      tags.join(" "),
      regions.join(" "),
      profileSummary,
      profileText,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

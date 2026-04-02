import { appConfig } from "../config/env.js";
import type {
  Lawyer,
  LawyerProfile,
  LawyerSearchResult,
  MatchMetadata,
} from "../types/lawyer.js";

export function mapLawyerToSearchResult(
  lawyer: Lawyer,
  matchMetadata: MatchMetadata,
): LawyerSearchResult {
  return {
    id: lawyer.id,
    name: lawyer.name,
    law_firm: lawyer.law_firm,
    city: lawyer.city,
    canton: lawyer.canton,
    specialties: lawyer.specialties,
    languages: lawyer.languages,
    profile_summary: lawyer.profile_summary,
    verified: lawyer.verified,
    curated: lawyer.curated,
    match_metadata: matchMetadata,
    source: appConfig.source,
    provider: appConfig.provider,
  };
}

export function mapLawyerToProfile(lawyer: Lawyer): LawyerProfile {
  return {
    ...mapLawyerToSearchResult(lawyer, {
      score: 0,
      matched_on: ["lawyer_id"],
      fallback_used: false,
    }),
    profile_text: lawyer.profile_text,
    verified: lawyer.verified,
    curated: lawyer.curated,
    contact_email: lawyer.contact_email,
    phone: lawyer.phone,
    website: lawyer.website,
    address: lawyer.address,
    last_updated: lawyer.last_updated,
    regions: lawyer.regions,
    tags: lawyer.tags,
  };
}

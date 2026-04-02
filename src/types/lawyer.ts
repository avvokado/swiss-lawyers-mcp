export type SearchStrategy = "exact" | "broad" | "fallback";

export interface Lawyer {
  id: string;
  name: string;
  law_firm: string;
  city: string;
  canton: string;
  specialties: string[];
  languages: string[];
  profile_summary: string;
  profile_text: string;
  verified: boolean;
  curated: boolean;
  contact_email?: string;
  phone?: string;
  website?: string;
  address?: string;
  last_updated?: string;
  regions?: string[];
  tags?: string[];
}

export interface LawyerSearchInput {
  query?: string;
  location?: string;
  specialty?: string;
  language?: string;
  limit: number;
}

export interface MatchMetadata {
  score: number;
  matched_on: string[];
  fallback_used: boolean;
  fallback_reason?: string;
}

export interface LawyerSearchResult {
  id: string;
  name: string;
  law_firm: string;
  city: string;
  canton: string;
  specialties: string[];
  languages: string[];
  profile_summary: string;
  verified: boolean;
  curated: boolean;
  match_metadata: MatchMetadata;
  source: string;
  provider?: string;
}

export interface LawyerProfile extends LawyerSearchResult {
  profile_text: string;
  verified: boolean;
  curated: boolean;
  contact_email?: string;
  phone?: string;
  website?: string;
  address?: string;
  last_updated?: string;
  regions?: string[];
  tags?: string[];
}

export interface AppliedFilters {
  query?: string;
  location?: string;
  specialty?: string;
  language?: string;
  limit: number;
}

export interface LawyerSearchResponse {
  results: LawyerSearchResult[];
  total_results: number;
  search_strategy: SearchStrategy;
  applied_filters: AppliedFilters;
  suggestions?: string[];
  source: string;
}

export interface LawyerProfileResponse {
  profile: LawyerProfile;
  source: string;
}

export interface ToolErrorResponse {
  error: {
    code: "INVALID_INPUT" | "NOT_FOUND" | "EMPTY_DATASET" | "INTERNAL_ERROR";
    message: string;
  };
}

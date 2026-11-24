import type { DirectoryProfile } from "../../services/api";

export type UserProfile = DirectoryProfile;

// For Sorting
export type SortOption = "relevance" | "experience" | "name";
export type SortDirection = "asc" | "desc";

export interface ProfileSort {
  option: SortOption;
  direction: SortDirection;
}

// For Filtering
export interface ProfileFilters {
  skills: string[];
}

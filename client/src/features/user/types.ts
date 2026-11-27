import type { DirectoryProfile } from "../../services/api";

// export type UserProfile = DirectoryProfile;
export type UserProfile = Omit<DirectoryProfile, "name"> & {
  name: Name;
};

export type Name = {
  first: string;
  middle?: string;
  last: string;
};


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

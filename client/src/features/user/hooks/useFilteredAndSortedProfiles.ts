import { useMemo } from "react";
import type { UserProfile } from "../types";
import { useProfileFilters } from "./useProfileFilters";
import { useProfileSort } from "./useProfileSort";
import { filterProfiles } from "../utils/filterProfiles";
import { sortProfiles } from "../utils/sortProfiles";

export function useFilteredAndSortedProfiles(profiles: UserProfile[]) {
  // filter & sort hooks
  const { filters, toggleSkill, resetFilters, hasActiveFilters } =
    useProfileFilters();

  const { sort, setSortOption, setSortDirection } = useProfileSort();

  const filteredAndSortedResults = useMemo(() => {
    // filter & sort results
    const filteredProfiles = filterProfiles(profiles, filters);
    const sortedProfiles = sortProfiles(filteredProfiles, sort);

    return sortedProfiles;
  }, [profiles, filters, sort]);

  const resultCount = filteredAndSortedResults.length;

  return {
    // from filter hooks
    filters,
    toggleSkill,
    resetFilters,
    hasActiveFilters,

    // from sort hooks
    sort,
    setSortOption,
    setSortDirection,
    resultCount,
    filteredAndSortedResults,
  };
}

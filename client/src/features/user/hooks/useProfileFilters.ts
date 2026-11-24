import { useState } from "react";
import type { ProfileFilters } from "../types";

export const DEFAULT_PROFILE_FILTERS: ProfileFilters = {
  skills: [],
};

export function useProfileFilters(
  initialFilters: ProfileFilters = DEFAULT_PROFILE_FILTERS,
) {
  const [filters, setFilters] = useState<ProfileFilters>(initialFilters);

  function toggleSkill(skill: string) {
    setFilters((prev) => {
      const exists = prev.skills.includes(skill);

      return {
        ...prev,
        skills: exists
          ? // remove existing skill from filter list
            prev.skills.filter((item) => item !== skill)
          : // add non-existing skill to the filter list
            [...prev.skills, skill],
      };
    });
  }

  function setSkills(skills: string[]) {
    setFilters({ skills });
  }

  function resetFilters() {
    setFilters(DEFAULT_PROFILE_FILTERS);
  }

  const hasActiveFilters = filters.skills.length > 0;

  return {
    filters,
    toggleSkill,
    setSkills,
    resetFilters,
    hasActiveFilters,
  };
}

import type { SortOption, ProfileSort, UserProfile } from "../types";

type ProfileComparator = (
  a: UserProfile,
  b: UserProfile,
  selectedSkills: string[],
) => number;

const SORT_COMPARATORS: Record<SortOption, ProfileComparator> = {
  name: (a, b) => a.name.localeCompare(b.name),
  experience: (a, b) => b.years - a.years,
  relevance: (a, b, selectedSkills) => {
    const scoreDiff =
      countSkillMatches(b, selectedSkills) - countSkillMatches(a, selectedSkills);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return a.name.localeCompare(b.name);
  }
};

// calculate how many of the user's skills match the skills from the selected list
function countSkillMatches(user: UserProfile, selectedSkills: string[]): number {
  if (selectedSkills.length === 0) {
    return 0;
  }

  const profileSkills = new Set(
    user.skills.map((skill) => skill.toLowerCase()),
  );

  return selectedSkills.reduce(
    (count, skill) =>
      profileSkills.has(skill.toLowerCase()) ? count + 1 : count,
    0,
  );
}

export function sortProfiles(
  profiles: UserProfile[],
  sort: ProfileSort,
  selectedSkills: string[] = [],
): UserProfile[] {
  const multiplier = sort.direction === "asc" ? 1 : -1;

  const compare = SORT_COMPARATORS[sort.option];

  return [...profiles].sort((a, b) => compare(a, b, selectedSkills) * multiplier);
}

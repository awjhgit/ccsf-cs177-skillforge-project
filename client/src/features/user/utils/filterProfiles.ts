import type { ProfileFilters, UserProfile } from "../types";

export function filterProfiles(
  profiles: UserProfile[],
  filters: ProfileFilters,
): UserProfile[] {
  
  // return all profiles if no skill filters were selected
  if (filters.skills.length === 0) {
    return profiles;
  }

  const requiredSkills = filters.skills.map((skill) => skill.toLowerCase());

  // return a new array of user profiles that include every 
  // required skill in the filter
  return profiles.filter((profile) => {
    const profileSkills = new Set(
      profile.skills.map((skill) => skill.toLowerCase()),
    );

    return requiredSkills.every((skill) => profileSkills.has(skill));
  });
}

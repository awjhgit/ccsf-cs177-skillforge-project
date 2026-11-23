import type { DirectoryProfile } from "../../../services/api";
import type { Filters } from "../FilterPanel/Filters";
import { toSkillKey } from "./skillKey";

export function filterAndSortProfiles(
  submittedQuery: string,
  directory: DirectoryProfile[],
  filters: Filters,
  sortBy: string,
) {
  const term = submittedQuery.trim().toLowerCase();
  const filtered = filterProfiles(directory, term, filters);
  return sortProfiles(filtered, term, sortBy);
}

function filterProfiles(
  directory: DirectoryProfile[],
  term: string,
  filters: Filters,
) {
  return directory.filter((employee) => {
    const searchableText = [
      employee.name,
      employee.title,
      employee.department,
      employee.description,
      ...employee.skills,
      ...employee.certifications,
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !term || searchableText.includes(term);

    const employeeSkills = employee.skills.map(toSkillKey);
    const matchesSkills = filters.skills.every((skill) =>
      employeeSkills.includes(skill),
    );

    const matchesDepartment =
      filters.departments.length === 0 ||
      filters.departments.includes(employee.department);

    const matchesCertification =
      filters.certifications.length === 0 ||
      filters.certifications.every((cert) =>
        employee.certifications.includes(cert),
      );

    const matchesExperience =
      !filters.experience ||
      (filters.experience === "0-2" && employee.years <= 2) ||
      (filters.experience === "3-5" &&
        employee.years >= 3 &&
        employee.years <= 5) ||
      (filters.experience === "6-10" &&
        employee.years >= 6 &&
        employee.years <= 10) ||
      (filters.experience === "10+" && employee.years > 10);

    return (
      matchesQuery &&
      matchesSkills &&
      matchesDepartment &&
      matchesCertification &&
      matchesExperience
    );
  });
}

function sortProfiles(
  filtered: DirectoryProfile[],
  term: string,
  sortBy: string,
) {
  return filtered.sort((a, b) => {
    if (sortBy === "experience") return b.years - a.years;
    if (sortBy === "alphabetical") return a.name.localeCompare(b.name);

    return calculateScore(b, term) - calculateScore(a, term);
  });
}

// Calculate a simple, explainable relevance score.
function calculateScore(employee: DirectoryProfile, term: string) {
  if (!term) return 0;

  const skills = employee.skills.map((s) => s.toLowerCase());
  const title = employee.title.toLowerCase();
  const description = employee.description.toLowerCase();

  let score = 0;

  if (skills.some((skill) => skill === term)) score += 100;
  else if (skills.some((skill) => skill.includes(term))) score += 70;

  if (title.includes(term)) score += 40;
  if (description.includes(term)) score += 20;

  // Experience is a tie-breaker, not proof of proficiency.
  return score + Math.min(employee.years, 10) * 0.1;
}

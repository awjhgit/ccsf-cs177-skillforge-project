import type { DirectoryProfile } from "../../../services/api";

// Calculate a simple, explainable relevance score.
export function calculateScore(employee: DirectoryProfile, term: string) {
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
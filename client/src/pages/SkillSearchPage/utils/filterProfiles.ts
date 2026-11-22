import type { DirectoryProfile } from "../../../services/api";
import type { Filters } from "../FilterPanel/Filters";

export function filterProfiles(
  directory: DirectoryProfile[],
  term: string,
  filters: Filters,
  skillKey: (skill: string) => string,
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

    const employeeSkills = employee.skills.map(skillKey);
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

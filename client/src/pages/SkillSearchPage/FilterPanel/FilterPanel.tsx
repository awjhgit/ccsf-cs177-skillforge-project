import { useMemo } from "react";
import type { DirectoryProfile } from "../../../services/api";
import type { Filters } from "./Filters";
import "./FilterPanel.css";

interface FilterPanelProps {
  skillQuery: string;
  directory: DirectoryProfile[];
  skillKey: (skill: string) => string;
  setFilters: (value: React.SetStateAction<Filters>) => void;
  clearFilters: () => void;
  filters: Filters;
  setSkillQuery: React.Dispatch<React.SetStateAction<string>>;
}

export default function FilterPanel({
  skillQuery,
  directory,
  skillKey,
  setFilters,
  clearFilters,
  filters,
  setSkillQuery,
}: FilterPanelProps) {

  const skillOptions = useMemo(() => {
    const labels = new Map<string, string>();
    for (const employee of directory) {
      for (const skill of employee.skills) {
        const key = skillKey(skill);
        if (!labels.has(key)) labels.set(key, skill.trim());
      }
    }
    return [...labels].sort(([, first], [, second]) =>
      first.localeCompare(second),
    );
  }, [directory]);

  const visibleSkills = skillOptions.filter(([key]) =>
    key.includes(skillKey(skillQuery)),
  );

  // Update one filter while preserving the others.
  function toggleFilter(
    category: "skills" | "departments" | "certifications",
    value: string,
  ) {
    setFilters((current) => {
      const values = current[category];
      const updated = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return { ...current, [category]: updated };
    });
  }

  return (
    <aside className="filters-panel">
      <div className="filter-heading">
        <h2>Filters</h2>
        <button className="text-button" onClick={clearFilters}>
          Clear all
        </button>
      </div>

      <fieldset className="filter-group">
        <legend>Skills</legend>
        <label className="skill-filter-search">
          Find a skill
          <input
            type="search"
            value={skillQuery}
            onChange={(event) => setSkillQuery(event.target.value)}
          />
        </label>
        <p className="skill-filter-hint" aria-live="polite">
          {filters.skills.length
            ? `${filters.skills.length} selected. Profiles must match every selected skill.`
            : "Select one or more skills."}
        </p>
        <div className="skill-filter-options">
          {visibleSkills.map(([key, label]) => (
            <label className="filter-option" key={key}>
              <input
                type="checkbox"
                checked={filters.skills.includes(key)}
                onChange={() => toggleFilter("skills", key)}
              />
              <span>{label}</span>
            </label>
          ))}
          {!visibleSkills.length && (
            <p className="skill-filter-hint">No skills match.</p>
          )}
        </div>
        {filters.skills.length > 0 && (
          <button
            className="text-button"
            onClick={() =>
              setFilters((current) => ({ ...current, skills: [] }))
            }
          >
            Clear skills
          </button>
        )}
      </fieldset>

      <p className="filter-note">
        Filters combine with your search to narrow the results.
      </p>
    </aside>
  );
}
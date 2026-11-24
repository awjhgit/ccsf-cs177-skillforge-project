import { useMemo } from "react";
import type { DirectoryProfile } from "../../../services/api";
import type { Filters } from "./Filters";
import { toSkillKey } from "../utils/skillKey";
import "./SearchPanel.css";

interface SearchPanelProps {
  skillQuery: string;
  setSkillQuery: React.Dispatch<React.SetStateAction<string>>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  clearFilters: () => void;
  directory: DirectoryProfile[];
  query: string;
  setSubmittedQuery: React.Dispatch<React.SetStateAction<string>>;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
}

export default function SearchPanel({
  skillQuery,
  setSkillQuery,
  filters,
  setFilters,
  clearFilters,
  directory,
  query,
  setSubmittedQuery,
  setQuery,
}: SearchPanelProps) {
  const skillOptions = useMemo(() => {
    const labels = new Map<string, string>();
    for (const employee of directory) {
      for (const skill of employee.skills) {
        const key = toSkillKey(skill);
        if (!labels.has(key)) labels.set(key, skill.trim());
      }
    }
    return [...labels].sort(([, first], [, second]) =>
      first.localeCompare(second),
    );
  }, [directory]);

  const visibleSkills = skillOptions.filter(([key]) =>
    key.includes(toSkillKey(skillQuery)),
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

  function search() {
    setSubmittedQuery(query);
  }

  return (
    <aside className="search-panel">
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <label className="search-input">
          <span aria-hidden="true">⌕</span>
          <input
            className="search-input-field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search skills or expertise (e.g., "Python", "cloud architecture")'
            aria-label="Search skills or expertise"
          />
        </label>

        <button className="primary-button" type="submit">
          Search
        </button>
      </form>

      

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

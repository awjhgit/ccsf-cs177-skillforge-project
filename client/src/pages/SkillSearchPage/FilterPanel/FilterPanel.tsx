import "./FilterPanel.css";
import SkillTag from "../../../components/SkillTag/SkillTag";
import { type SortOption } from "../../../features/user/index";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "experience", label: "Years of experience" },
  { value: "name", label: "Name (A–Z)" },
];

interface FilterPanelProps {
  skillQueryList: string[];
  resultCount: number;
  setSortBy: React.Dispatch<React.SetStateAction<SortOption>>;
  sortBy: SortOption;
}

export default function FilterPanel({
  skillQueryList,
  resultCount,
  setSortBy,
  sortBy,
}: FilterPanelProps) {
  const profileOrProfilesLabel = resultCount === 1 ? "Profile" : "Profiles";

  return (
    <section className="filter-panel" aria-label="Employee search">
      <div className="search-meta">
        <p>
          Matching {profileOrProfilesLabel} : <strong>{resultCount}</strong>
        </p>

        <label className="sort-control">
          <span>Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="skill-query-list">
        {skillQueryList.length > 0 &&
          skillQueryList.map((skill) => (
            <SkillTag skillName={skill} key={skill} />
          ))}
      </div>
    </section>
  );
}

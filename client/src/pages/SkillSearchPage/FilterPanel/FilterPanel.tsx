import "./FilterPanel.css";
import type {SortOption} from "../../../features/user-search/index";


const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "experience", label: "Years of experience" },
  { value: "alphabetical", label: "Name (A–Z)" },
];

interface FilterPanelProps {
  submittedQuery: string;
  resultCount: number;
  setSortBy: React.Dispatch<React.SetStateAction<SortOption>>
  sortBy: SortOption;
}

export default function FilterPanel({
  submittedQuery,
  resultCount,
  setSortBy,
  sortBy
}: FilterPanelProps) {

  const profileOrProfilesLabel = (resultCount === 1) ? "profile" : "profiles";


  return (
    <section className="filter-panel" aria-label="Employee search">
      <div className="search-meta">
        <p>
          Showing <strong>{resultCount}</strong> {profileOrProfilesLabel} 
          {submittedQuery && (
            <strong>
              {" "}
              for <strong>“{submittedQuery}”</strong>
            </strong>
          )}
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
    </section>
  );
}

import { type DirectoryProfile } from "../../../services/api";
import "./FilterPanel.css";

interface FilterPanelProps {
  submittedQuery: string;
  results: DirectoryProfile[];
  setSortBy: React.Dispatch<React.SetStateAction<string>>
  sortBy: string;
}

export default function FilterPanel({
  submittedQuery,
  results,
  setSortBy,
  sortBy
}: FilterPanelProps) {

  return (
    <section className="filter-panel" aria-label="Employee search">
      <div className="search-meta">
        <p>
          Showing <strong>{results.length}</strong>{" "}
          {results.length === 1 ? "profile" : "profiles"}
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
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="experience">Years of experience</option>
            <option value="alphabetical">Name (A–Z)</option>
          </select>
        </label>
      </div>
    </section>
  );
}

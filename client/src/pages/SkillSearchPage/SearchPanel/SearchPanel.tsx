import { type DirectoryProfile } from "../../../services/api";
import "./SearchPanel.css";

interface SearchPanelProps {
  query: string;
  submittedQuery: string;
  setSubmittedQuery: React.Dispatch<React.SetStateAction<string>>;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  results: DirectoryProfile[];
  setSortBy: React.Dispatch<React.SetStateAction<string>>
  sortBy: string;
}

export default function SearchPanel({
  query,
  submittedQuery,
  setSubmittedQuery,
  setQuery,
  results,
  setSortBy,
  sortBy

}: SearchPanelProps) {

  function search() {
    setSubmittedQuery(query);
  }

  return (
    <section className="search-panel" aria-label="Employee search">
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

import ProfileCard from "../../components/ProfileCard/ProfileCard";
import type { DirectoryProfile } from "../../services/api";
import "./SearchResults.css";

interface SearchResultsProps {
  profilesLoading: boolean;
  profilesError: boolean;
  results: DirectoryProfile[];
  setSelectedEmployee: React.Dispatch<
    React.SetStateAction<DirectoryProfile | null>
  >;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setSubmittedQuery: React.Dispatch<React.SetStateAction<string>>;
  clearFilters: () => void;
}

export default function SearchResults({
  profilesLoading,
  profilesError,
  results,
  setSelectedEmployee,
  setQuery,
  setSubmittedQuery,
  clearFilters,
}: SearchResultsProps) {
  if (profilesLoading)
    return (
      <section className="results-area" aria-label="Search results">
        <p role="status">Loading profiles…</p>
      </section>
    );

  if (profilesError) return null;

  const haveResults = results.length > 0;
  if (!haveResults) {
    return (
      <section className="results-area" aria-label="Search results">
        <div className="empty-state">
          <h2>No matching profiles found</h2>
          <p>
            Try another skill or remove some filters to see more colleagues.
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              setQuery("");
              setSubmittedQuery("");
              clearFilters();
            }}
          >
            Clear search and filters
          </button>
        </div>
      </section>
    );
  }

  return (
    // have results to display
    <section className="results-area" aria-label="Search results">
      <div className="profile-grid">
        {results.map((employee) => (
          <ProfileCard
            employee={employee}
            setSelectedEmployee={setSelectedEmployee}
          />
        ))}
      </div>
    </section>
  );
}

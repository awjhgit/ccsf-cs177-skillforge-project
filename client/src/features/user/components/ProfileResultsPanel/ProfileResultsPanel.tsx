import type { UserProfile } from "../../types";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import "./ProfileResultsPanel.css"

interface ProfileResultsPanelProps {
  results: UserProfile[];
  resultCount: number;
  onResetFilters: () => void;
}

export default function ProfileResultsPanel({
  results,
  resultCount,
  onResetFilters,
}: ProfileResultsPanelProps) {
  const haveResults = resultCount != 0;

  if (!haveResults) {
    return (
      <section className="profile-result-panel">
        <div className="no-results-container">
          <h2>No matching profiles found</h2>
          <p>
            Try another skill or remove some filters to see more profiles.
          </p>
          <button
            type="button"
            className="reset-filters-button"
            onClick={onResetFilters}
          >
            Clear Search and Filters
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-result-panel">
      <div className="profile-results-container">
        {results.map((profile) => (
          <UserProfileCard
            key={profile.id}
            profile={profile}
            onConnect={() => {}}
          />
        ))}
      </div>
    </section>
  );
}

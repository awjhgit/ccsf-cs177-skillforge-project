import type {
  ProfileFilters,
  ProfileSort,
  SortOption,
  SortDirection,
} from "../../types";
import ProfileFilterSelectBar from "../ProfileFilterSelectBar/ProfileFilterSelectBar";
import ProfileSortSelect from "../ProfileSortSelect/ProfileSortSelect";
import "./ProfileFilterAndSortPanel.css";

interface ProfileFilterAndSortPanelProps {
  availableSkills: string[];

  // from filter hooks
  filters: ProfileFilters;
  toggleSkill: (skill: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;

  // from sort hooks
  sort: ProfileSort;
  setSortOption: (option: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;

  // result count
  resultCount: number;
}

export default function ProfileFilterAndSortPanel({
  availableSkills,
  filters,
  toggleSkill,
  resetFilters,
  hasActiveFilters,
  sort,
  setSortOption,
  setSortDirection,
  resultCount,
}: ProfileFilterAndSortPanelProps) {
  const profileOrProfilesLabel = resultCount === 1 ? "Profile" : "Profiles";

  return (
    <section className="filter-and-sort-panel">
      <div className="panel-header">
        <div className="result-summary">
          <p>
            Matching {profileOrProfilesLabel} : <strong>{resultCount}</strong>
          </p>
        </div>
        <div className="sort-controls-container">
          <ProfileSortSelect
            onDirectionChange={setSortDirection}
            onSortOptionChange={setSortOption}
            sort={sort}
          ></ProfileSortSelect>
        </div>
      </div>
      <div className="skill-filter-options-container">
        <ProfileFilterSelectBar
          filters={filters}
          availableSkills={availableSkills}
          hasActiveFilters={hasActiveFilters}
          onToggleSkill={toggleSkill}
          onReset={resetFilters}
        />
      </div>
    </section>
  );
}

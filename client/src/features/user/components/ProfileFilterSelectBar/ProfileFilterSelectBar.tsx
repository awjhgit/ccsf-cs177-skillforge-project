import type { ProfileFilters } from "../../types";
import "./ProfileFilterSelectBar.css";

interface ProfileFilterSelectBarProps {
  filters: ProfileFilters;
  availableSkills: string[];
  hasActiveFilters: boolean;
  onToggleSkill: (skill: string) => void;
  onReset: () => void;
}

export default function ProfileFilterSelectBar({
  filters,
  availableSkills,
  hasActiveFilters,
  onToggleSkill,
  onReset,
}: ProfileFilterSelectBarProps) {
  return (
    <div className="filter-controls">
      <div className="filter-buttons-container">
        {availableSkills.map((skill) => {
          const isSelected = filters.skills.includes(skill);

          return (
            <button
              className={
                "filter-tag-button " +
                (isSelected ? "selected-filter-tag" : "not-selected-filter-tag")
              }
              key={skill}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggleSkill(skill)}
            >
              {skill}
            </button>
          );
        })}
      </div>
      {hasActiveFilters && (
        <div className="clear-button-container">
          <button
            className="clear-filter-button"
            type="button"
            onClick={onReset}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

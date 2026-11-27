import type { ProfileSort, SortOption, SortDirection } from "../../types";
import "./ProfileSortSelect.css";

const SORT_FIELD_LABELS: Record<SortOption, string> = {
  name: "Name",
  experience: "Experience",
  relevance: "Relevance",
};

interface ProfileSortSelectProps {
  sort: ProfileSort;
  onSortOptionChange: (option: SortOption) => void;
  onDirectionChange: (direction: SortDirection) => void;
}

export default function ProfileSortSelect({
  sort,
  onSortOptionChange,
  onDirectionChange,
}: ProfileSortSelectProps) {
  return (
    <>
      <label className="profile-sort-control">
        <span>Sort by</span>
        <select
          className="sort-option-menu"
          value={sort.option}
          onChange={(event) =>
            onSortOptionChange(event.target.value as SortOption)
          }
        >
          {(Object.keys(SORT_FIELD_LABELS) as SortOption[]).map((field) => (
            <option key={field} value={field}>
              {SORT_FIELD_LABELS[field]}
            </option>
          ))}
        </select>

        <button
          className="direction-button"
          type="button"
          onClick={() =>
            onDirectionChange(sort.direction === "asc" ? "desc" : "asc")
          }
        >
          {sort.direction === "asc" ? "🠛" : "🠙"}
        </button>
      </label>
    </>
  );
}

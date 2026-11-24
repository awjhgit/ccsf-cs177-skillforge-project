import { useState } from "react";
import type { ProfileSort, SortOption, SortDirection } from "../types";

export const DEFAULT_PROFILE_SORT: ProfileSort = {
  option: "relevance",
  direction: "asc",
};

export function useProfileSort(
  initialSort: ProfileSort = DEFAULT_PROFILE_SORT,
) {
  const [sort, setSort] = useState<ProfileSort>(initialSort);

  function setSortOption(option: SortOption) {
    setSort((prev) => ({ option: option, direction: prev.direction }));
  }

  function setSortDirection(direction: SortDirection) {
    setSort((prev) => ({ option: prev.option, direction: direction }));
  }

  return {
    sort,
    setSortOption,
    setSortDirection,
  };
}

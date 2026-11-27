import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "./PageHeader/PageHeader";
import SearchPanel from "./SearchPanel/SearchPanel";
import { api, type DirectoryProfile } from "../../services/api";
import type { Filters } from "./SearchPanel/Filters";
import { filterAndSortProfiles } from "./utils/filterAndSortProfiles";
import "./SkillSearchPage.css";
import {
  type UserProfile,
  type SortOption,
  useFilteredAndSortedProfiles,
  ProfileFilterAndSortPanel,
  ProfileResultsPanel,
} from "../../features/user/index";
import { mockDirectoryProfiles } from "./mockProfiles";

interface SkillsSearchPageProps {
  logoutError: string;
}

export default function SkillSearchPage({
  logoutError,
}: SkillsSearchPageProps) {
  const [directory, setDirectory] = useState<DirectoryProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .profiles()
      .then(({ profiles }) => {
        if (!cancelled) setDirectory(profiles);
      })
      .catch(() => {
        if (!cancelled) setProfilesError(true);
      })
      .finally(() => {
        if (!cancelled) setProfilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  type Employee = DirectoryProfile;

  const emptyFilters: Filters = {
    skills: [],
    departments: [],
    experience: "",
    certifications: [],
  };

  const [skillQuery, setSkillQuery] = useState("");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sortBy, setSortBy] = useState("relevance" as SortOption);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const profileDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selectedEmployee) profileDialog.current?.showModal();
  }, [selectedEmployee]);

  function clearFilters() {
    setFilters(emptyFilters);
    setSkillQuery("");
  }

  const results = useMemo(() => {
    return filterAndSortProfiles(submittedQuery, directory, filters, sortBy);
  }, [directory, submittedQuery, filters, sortBy]);

  // ===================================
  // Mock Data Setup -- Start
  // ===================================
  const mockProfiles: UserProfile[] = mockDirectoryProfiles;

  const mockAvailableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    for (const profile of mockProfiles) {
      for (const skill of profile.skills) {
        skillSet.add(skill);
      }
    }
    return Array.from(skillSet).sort((a, b) => a.localeCompare(b));
  }, [mockProfiles]);

  // Use hooks to access filter and sort results
  const {
    // from filter hook
    filters: mockfilters,
    toggleSkill: mocktoggleSkill,
    resetFilters: mockresetFilters,
    hasActiveFilters: mockhasActiveFilters,

    // from sort hook
    sort: mocksort,
    setSortOption: mocksetSortOption,
    setSortDirection: mocksetSortDirection,

    // computed filtered & sorted results
    resultCount: mockresultCount,
    filteredAndSortedResults: mockfilteredAndSortedResults,
  } = useFilteredAndSortedProfiles(mockProfiles);

  // ===================================
  // Mock Data Setup -- End
  // ===================================
  return (
    <div className="skills-directory">
      <main id="directory" className="page">
        {profilesError && (
          <p role="alert">
            Directory profiles could not load. Refresh to try again.
          </p>
        )}
        {logoutError && <p role="alert">{logoutError}</p>}

        <PageHeader />

        <div className="body-container">
          <SearchPanel
            skillQuery={skillQuery}
            setSkillQuery={setSkillQuery}
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            directory={directory}
            query={query}
            setQuery={setQuery}
            setSubmittedQuery={setSubmittedQuery}
          />

          <div className="search-results-container">
            <ProfileFilterAndSortPanel
              availableSkills={mockAvailableSkills}
              filters={mockfilters}
              toggleSkill={mocktoggleSkill}
              resetFilters={mockresetFilters}
              hasActiveFilters={mockhasActiveFilters}
              sort={mocksort}
              setSortOption={mocksetSortOption}
              setSortDirection={mocksetSortDirection}
              resultCount={mockresultCount}
            />

            <ProfileResultsPanel
              results={mockfilteredAndSortedResults}
              resultCount={mockresultCount}
              onResetFilters={mockresetFilters}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import PageHeader from "./PageHeader/PageHeader";
import { api } from "../../services/api";
import "./SkillSearchPage.css";
import {
  type UserProfile,
  ProfileSearchPanel,
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
  const [profilesError, setProfilesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .profiles()
      .then(({ profiles }) => {
        if (!cancelled) {
          /*setDirectory(profiles);*/
        }
      })
      .catch(() => {
        if (!cancelled) setProfilesError(true);
      })
      .finally(() => {
        if (!cancelled) {
          /*setProfilesLoading(false);*/
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          <div className="search-panel-container">
            <ProfileSearchPanel skillsDirectory={mockAvailableSkills} />
          </div>
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
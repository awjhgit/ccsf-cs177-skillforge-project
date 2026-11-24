import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "./PageHeader/PageHeader";
import ProfileModal from "./ProfileModal/ProfileModal";
import FilterPanel from "./FilterPanel/FilterPanel";
import EventualFilterPanel from "./EventualFilterPanel/EventualFilterPanel";
import SearchResults from "./SearchResults/SearchResults";
import { api, type DirectoryProfile } from "../../services/api";
import type { Filters } from "./FilterPanel/Filters";
import { filterAndSortProfiles } from "./utils/filterAndSortProfiles";
import "./SkillSearchPage.css";

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
  const [sortBy, setSortBy] = useState("relevance");
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
    return filterAndSortProfiles(
      submittedQuery,
      directory,
      filters,
      sortBy,
    );
  }, [directory, submittedQuery, filters, sortBy]);

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
          <FilterPanel
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
            <EventualFilterPanel
              submittedQuery={submittedQuery}
              results={results}
              setSortBy={setSortBy}
              sortBy={sortBy}
            />

            <SearchResults
              profilesLoading={profilesLoading}
              profilesError={profilesError}
              results={results}
              setSelectedEmployee={setSelectedEmployee}
              setQuery={setQuery}
              setSubmittedQuery={setSubmittedQuery}
              clearFilters={clearFilters}
            />
          </div>
        </div>
      </main>

      {selectedEmployee && (
        <ProfileModal
          profileDialog={profileDialog}
          setSelectedEmployee={setSelectedEmployee}
          selectedEmployee={selectedEmployee}
        />
      )}
    </div>
  );
}

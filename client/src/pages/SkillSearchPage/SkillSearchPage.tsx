import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header/Header";
import PageHeader from "./PageHeader/PageHeader";
import ProfileView from "../../components/ProfileView/ProfileView";
import FilterPanel from "./FilterPanel/FilterPanel";
import SearchPanel from "./SearchPanel/SearchPanel";
import SearchResults from "./SearchResults/SearchResults";
import { api, type DirectoryProfile } from "../../services/api";
import type { Filters } from "./FilterPanel/Filters";
import type { User } from "../../types/user";
import { filterAndSortProfiles } from "./utils/filterAndSortProfiles";
import "./SkillSearchPage.css";

interface SkillsSearchPageProps {
  currentUser: User;
  onLogout: () => Promise<void>;
}

export default function SkillSearchPage({
  currentUser,
  onLogout,
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

  const skillKey = (skill: string) => skill.trim().toLowerCase();

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

  const [logoutError, setLogoutError] = useState("");
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
      skillKey,
      sortBy,
    );
  }, [directory, submittedQuery, filters, sortBy]);

  return (
    <div className="skills-directory">
      <Header
        currentUser={currentUser}
        setLogoutError={setLogoutError}
        onLogout={onLogout}
      />

      <main id="directory" className="page">
        {profilesError && (
          <p role="alert">
            Directory profiles could not load. Refresh to try again.
          </p>
        )}
        {logoutError && <p role="alert">{logoutError}</p>}
        
        <PageHeader />

        <SearchPanel
          query={query}
          submittedQuery={submittedQuery}
          setSubmittedQuery={setSubmittedQuery}
          setQuery={setQuery}
          results={results}
          setSortBy={setSortBy}
          sortBy={sortBy}
        />

        <div className="directory-layout">
          <FilterPanel
            skillQuery={skillQuery}
            directory={directory}
            skillKey={skillKey}
            setFilters={setFilters}
            clearFilters={clearFilters}
            filters={filters}
            setSkillQuery={setSkillQuery}
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
      </main>

      {selectedEmployee && (
        <ProfileView
          profileDialog={profileDialog}
          setSelectedEmployee={setSelectedEmployee}
          selectedEmployee={selectedEmployee}
        />
      )}
    </div>
  );
}

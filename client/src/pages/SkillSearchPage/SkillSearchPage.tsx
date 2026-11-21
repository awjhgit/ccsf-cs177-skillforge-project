import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header/Header";
import ProfileView from "../../components/ProfileView/ProfileView";
import FilterPanel from "./FilterPanel/FilterPanel";
import SearchResults from "./SearchResults/SearchResults";
import { api, type DirectoryProfile } from "../../services/api";
import type { Filters } from "./FilterPanel/Filters";
import type { User } from "../../types/user";
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

  // Calculate a simple, explainable relevance score.
  function calculateScore(employee: Employee, term: string) {
    if (!term) return 0;

    const skills = employee.skills.map((s) => s.toLowerCase());
    const title = employee.title.toLowerCase();
    const description = employee.description.toLowerCase();

    let score = 0;

    if (skills.some((skill) => skill === term)) score += 100;
    else if (skills.some((skill) => skill.includes(term))) score += 70;

    if (title.includes(term)) score += 40;
    if (description.includes(term)) score += 20;

    // Experience is a tie-breaker, not proof of proficiency.
    return score + Math.min(employee.years, 10) * 0.1;
  }

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
    const term = submittedQuery.trim().toLowerCase();

    const filtered = directory.filter((employee) => {
      const searchableText = [
        employee.name,
        employee.title,
        employee.department,
        employee.description,
        ...employee.skills,
        ...employee.certifications,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !term || searchableText.includes(term);

      const employeeSkills = employee.skills.map(skillKey);
      const matchesSkills = filters.skills.every((skill) =>
        employeeSkills.includes(skill),
      );

      const matchesDepartment =
        filters.departments.length === 0 ||
        filters.departments.includes(employee.department);

      const matchesCertification =
        filters.certifications.length === 0 ||
        filters.certifications.every((cert) =>
          employee.certifications.includes(cert),
        );

      const matchesExperience =
        !filters.experience ||
        (filters.experience === "0-2" && employee.years <= 2) ||
        (filters.experience === "3-5" &&
          employee.years >= 3 &&
          employee.years <= 5) ||
        (filters.experience === "6-10" &&
          employee.years >= 6 &&
          employee.years <= 10) ||
        (filters.experience === "10+" && employee.years > 10);

      return (
        matchesQuery &&
        matchesSkills &&
        matchesDepartment &&
        matchesCertification &&
        matchesExperience
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "experience") return b.years - a.years;
      if (sortBy === "alphabetical") return a.name.localeCompare(b.name);

      return calculateScore(b, term) - calculateScore(a, term);
    });
  }, [directory, submittedQuery, filters, sortBy]);

  function search() {
    setSubmittedQuery(query);
  }

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
        <section className="page-heading">
          <p className="eyebrow">PEOPLE & SKILL LIBRARY</p>
          <h1>Skills Directory</h1>
          <p>
            Find colleagues with the right skills and experience to collaborate,
            learn, and grow.
          </p>
        </section>

        <section className="search-panel" aria-label="Employee search">
          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault();
              search();
            }}
          >
            <label className="search-input">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Search skills or expertise (e.g., "Python", "cloud architecture")'
                aria-label="Search skills or expertise"
              />
            </label>

            <button className="primary-button" type="submit">
              Search
            </button>
          </form>

          <div className="search-meta">
            <p>
              Showing <strong>{results.length}</strong>{" "}
              {results.length === 1 ? "profile" : "profiles"}
              {submittedQuery && (
                <>
                  {" "}
                  for <strong>“{submittedQuery}”</strong>
                </>
              )}
            </p>

            <label className="sort-control">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="experience">Years of experience</option>
                <option value="alphabetical">Name (A–Z)</option>
              </select>
            </label>
          </div>
        </section>

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

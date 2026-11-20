import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import Footer from './components/Footer/Footer';
import RegisterPage from './pages/RegisterPage';
import ProfileDashboard from './pages/ProfileDashboard';
import ProfilePage from './pages/ProfilePage';
import { api, type DirectoryProfile } from './services/api';
import type { User } from './types/user';
import './styles/App.css';
import './styles/Directory.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.session().then(({ user }) => {
      if (!cancelled) setCurrentUser(user);
    }).catch(() => {
      if (!cancelled) setError('Could not connect to Skill Forge. Check that the server is running.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [attempt]);

  const expireSession = useCallback(() => setCurrentUser(null), []);

  async function logout() {
    await api.logout();
    setCurrentUser(null);
  }

  if (loading) return <main className="login-container"><p role="status" className="login-card">Loading Skill Forge…</p></main>;
  if (error) return <main className="login-container"><div className="login-card"><p role="alert">{error}</p><button onClick={() => { setLoading(true); setError(''); setAttempt((value) => value + 1); }}>Try again</button></div></main>;
  const authorized = currentUser?.status === 'Active';
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={authorized ? <Navigate to="/directory" replace /> : <LoginPage onLogin={setCurrentUser} />} />
        <Route path="/register" element={authorized ? <Navigate to="/directory" replace /> : <RegisterPage />} />
        <Route path="/directory" element={authorized ? <SkillsDirectory currentUser={currentUser} onLogout={logout} /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={authorized ? <ProfileDashboard user={currentUser} onSessionExpired={expireSession} /> : <Navigate to="/login" replace />} />
        <Route path="/profile/edit" element={authorized ? <ProfilePage user={currentUser} onSessionExpired={expireSession} /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={authorized && currentUser.role === 'Admin' ? <AdminPage onLogout={logout} onSessionExpired={expireSession} /> : <Navigate to={authorized ? '/directory' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={authorized ? '/directory' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

type Employee = DirectoryProfile;

const skillKey = (skill: string) => skill.trim().toLowerCase();

type Filters = {
  skills: string[];
  departments: string[];
  experience: string;
  certifications: string[];
};

const emptyFilters: Filters = {
  skills: [],
  departments: [],
  experience: "",
  certifications: [],
};

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


interface SkillsDirectoryProps {
  currentUser: User;
  onLogout: () => Promise<void>;
}

function SkillsDirectory({ currentUser, onLogout }: SkillsDirectoryProps) {
  const [directory, setDirectory] = useState<DirectoryProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.profiles().then(({ profiles }) => {
      if (!cancelled) setDirectory(profiles);
    }).catch(() => {
      if (!cancelled) setProfilesError(true);
    }).finally(() => {
      if (!cancelled) setProfilesLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const departments = [...new Set(['Engineering', 'IT', 'Product', 'Sales', 'Marketing', ...directory.map((entry) => entry.department)])];
  const certifications = [...new Set(directory.flatMap((entry) => entry.certifications))];
  const skillOptions = useMemo(() => {
    const labels = new Map<string, string>();
    for (const employee of directory) {
      for (const skill of employee.skills) {
        const key = skillKey(skill);
        if (!labels.has(key)) labels.set(key, skill.trim());
      }
    }
    return [...labels].sort(([, first], [, second]) => first.localeCompare(second));
  }, [directory]);
  const [skillQuery, setSkillQuery] = useState('');
  const visibleSkills = skillOptions.filter(([key]) => key.includes(skillKey(skillQuery)));
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const profileDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selectedEmployee) profileDialog.current?.showModal();
  }, [selectedEmployee]);

  function closeProfile() {
    profileDialog.current?.close();
    setSelectedEmployee(null);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try { await onLogout(); }
    catch { setLogoutError("Could not log out. Please try again."); }
    finally { setLoggingOut(false); }
  }

  // Update one filter while preserving the others.
  function toggleFilter(
    category: "skills" | "departments" | "certifications",
    value: string
  ) {
    setFilters((current) => {
      const values = current[category];
      const updated = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return { ...current, [category]: updated };
    });
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setSkillQuery('');
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
      const matchesSkills = filters.skills.every((skill) => employeeSkills.includes(skill));

      const matchesDepartment =
        filters.departments.length === 0 ||
        filters.departments.includes(employee.department);

      const matchesCertification =
        filters.certifications.length === 0 ||
        filters.certifications.every((cert) =>
          employee.certifications.includes(cert)
        );

      const matchesExperience =
        !filters.experience ||
        (filters.experience === "0-2" &&
          employee.years <= 2) ||
        (filters.experience === "3-5" &&
          employee.years >= 3 &&
          employee.years <= 5) ||
        (filters.experience === "6-10" &&
          employee.years >= 6 &&
          employee.years <= 10) ||
        (filters.experience === "10+" &&
          employee.years > 10);

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
      <header className="topbar">
        <Link className="brand" to="/directory" aria-label="Skill Forge home">
          <span className="brand-icon">✳</span>
          Skill Forge
        </Link>

        <nav className="navigation" aria-label="Main navigation">
          <Link className="active" to="/directory" aria-current="page">Directory</Link>
          <Link to="/profile">My Profile</Link>
          {currentUser.role === 'Admin' && <Link to="/admin">Account Management</Link>}
          <button disabled title="Coming soon">My Connections</button>
          <button disabled title="Coming soon">Rewards</button>
          <button disabled title="Coming soon">Analytics</button>
        </nav>

        <div className="account">
          <span className="avatar initials" aria-hidden="true">{currentUser.name.split(" ").map((part) => part[0]).join("")}</span>
          <span>{currentUser.name}</span>
          <button className="secondary-button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Logging out…" : "Log Out"}</button>
        </div>
      </header>

      <main id="directory" className="page">
        {profilesError && <p role="alert">Directory profiles could not load. Refresh to try again.</p>}
        {logoutError && <p role="alert">{logoutError}</p>}
        <section className="page-heading">
          <p className="eyebrow">PEOPLE & SKILL LIBRARY</p>
          <h1>Skills Directory</h1>
          <p>
            Find colleagues with the right skills and experience
            to collaborate, learn, and grow.
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
                <> for <strong>“{submittedQuery}”</strong></>
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
          <aside className="filters-panel">
            <div className="filter-heading">
              <h2>Filters</h2>
              <button className="text-button" onClick={clearFilters}>
                Clear all
              </button>
            </div>

            <fieldset className="filter-group">
              <legend>Skills</legend>
              <label className="skill-filter-search">
                Find a skill
                <input type="search" value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} />
              </label>
              <p className="skill-filter-hint" aria-live="polite">
                {filters.skills.length ? `${filters.skills.length} selected. Profiles must match every selected skill.` : 'Select one or more skills.'}
              </p>
              <div className="skill-filter-options">
                {visibleSkills.map(([key, label]) => (
                  <label className="filter-option" key={key}>
                    <input type="checkbox" checked={filters.skills.includes(key)} onChange={() => toggleFilter('skills', key)} />
                    <span>{label}</span>
                  </label>
                ))}
                {!visibleSkills.length && <p className="skill-filter-hint">No skills match.</p>}
              </div>
              {filters.skills.length > 0 && (
                <button className="text-button" onClick={() => setFilters((current) => ({ ...current, skills: [] }))}>
                  Clear skills
                </button>
              )}
            </fieldset>

            <fieldset className="filter-group">
              <legend>Department</legend>
              {departments.map(
                (department) => (
                  <label className="filter-option" key={department}>
                    <input
                      type="checkbox"
                      checked={filters.departments.includes(department)}
                      onChange={() =>
                        toggleFilter("departments", department)
                      }
                    />
                    <span>{department}</span>
                  </label>
                )
              )}
            </fieldset>

            <fieldset className="filter-group">
              <legend>Experience</legend>
              {[
                ["0-2", "0–2 years"],
                ["3-5", "3–5 years"],
                ["6-10", "6–10 years"],
                ["10+", "10+ years"],
              ].map(([value, label]) => (
                <label className="filter-option" key={value}>
                  <input
                    type="radio"
                    name="experience"
                    checked={filters.experience === value}
                    onChange={() =>
                      setFilters((current) => ({
                        ...current,
                        experience: value,
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
              <button
                className="text-button clear-experience"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    experience: "",
                  }))
                }
              >
                Clear experience
              </button>
            </fieldset>

            <fieldset className="filter-group">
              <legend>Certifications</legend>
              {certifications.map((certification) => (
                <label className="filter-option" key={certification}>
                  <input
                    type="checkbox"
                    checked={filters.certifications.includes(certification)}
                    onChange={() =>
                      toggleFilter("certifications", certification)
                    }
                  />
                  <span>{certification}</span>
                </label>
              ))}
            </fieldset>

            <p className="filter-note">
              Filters combine with your search to narrow the results.
            </p>
          </aside>

          <section className="results-area" aria-label="Search results">
            {profilesLoading ? <p role="status">Loading profiles…</p> : profilesError ? null : results.length > 0 ? (
              <div className="profile-grid">
                {results.map((employee) => (
                  <article className="profile-card" key={employee.id}>
                    <div className="profile-card-header">
                      <div className="avatar">
                        {employee.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div className="identity">
                        <h3>{employee.name}</h3>
                        <p>{employee.title}</p>
                        <span className="department-tag">
                          {employee.department}
                        </span>
                      </div>
                    </div>

                    <div className="skill-tags">
                      {employee.skills.map((skill) => (
                        <span className="skill-tag" key={skill}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <p className="experience-description">
                      {employee.description}
                    </p>

                    <div className="profile-details">
                      <span>
                        <strong>{employee.years} yrs</strong> experience
                      </span>
                      {employee.certifications.length > 0 && (
                        <span
                          className="certification"
                          title={employee.certifications.join(", ")}
                        >
                          ✧ {employee.certifications[0]}
                        </span>
                      )}
                    </div>

                    <div className="card-footer">
                      <div className="external-links">
                        {employee.links.map((link, index) => (
                          <a
                            href={link.url}
                            key={index}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${employee.name}: ${link.label}`}
                            title={link.label}
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        View Profile
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>No matching profiles found</h2>
                <p>
                  Try another skill or remove some filters to
                  see more colleagues.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setQuery("");
                    setSubmittedQuery("");
                    clearFilters();
                  }}
                >
                  Clear search and filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedEmployee && (
        <dialog
          ref={profileDialog}
          className="profile-modal"
          aria-labelledby="modal-title"
          onCancel={(event) => { event.preventDefault(); closeProfile(); }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeProfile();
          }}
        >
            <button
              className="modal-close"
              onClick={closeProfile}
              aria-label="Close profile"
            >
              ×
            </button>

            <div className="modal-profile-header">
              <div className="avatar large">
                {selectedEmployee.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div>
                <h2 id="modal-title">{selectedEmployee.name}</h2>
                <p>{selectedEmployee.title}</p>
                <span className="department-tag">
                  {selectedEmployee.department}
                </span>
              </div>
            </div>

            <h3>Skills and expertise</h3>
            <div className="skill-tags">
              {selectedEmployee.skills.map((skill) => (
                <span className="skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>

            <h3>Experience</h3>
            <p>{selectedEmployee.description}</p>
            <p>
              <strong>{selectedEmployee.years} years</strong> of
              reported experience.
            </p>

            <h3>Certifications</h3>
            <p>
              {selectedEmployee.certifications.join(", ") ||
                "No certifications listed."}
            </p>

            <h3>External profiles</h3>
            <div className="modal-links">
              {selectedEmployee.links.map((link, index) => (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  key={index}
                >
                  {link.label} ↗
                </a>
              ))}
            </div>

            <button
              className="primary-button modal-action"
              onClick={() =>
                window.alert(
                  "Connection requests will be implemented in the next phase."
                )
              }
            >
              Request Connection
            </button>
        </dialog>
      )}

      <Footer />
    </div>
  );
}


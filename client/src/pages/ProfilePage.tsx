import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, type ProfileOverview } from '../services/api';
import type { User } from '../types/user';
import '../styles/ProfilePage.css';

interface ProfilePageProps {
  user: User;
  onSessionExpired: () => void;
}

export default function ProfilePage({ user, onSessionExpired }: ProfilePageProps) {
  const [overview, setOverview] = useState<ProfileOverview | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.profile().then((data) => {
      if (!cancelled) setOverview(data);
    }).catch((error) => {
      if (cancelled) return;
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      else setError('Could not load your profile.');
    });
    return () => { cancelled = true; };
  }, [attempt, onSessionExpired]);

  const profile = overview?.profile;

  return (
    <div className="skills-directory">
      <main className="page profile-dashboard">
        <Link to="/search">← Skills Directory</Link>
        <header className="page-heading dashboard-heading">
          <div>
            <h1>{user.name}</h1>
            {profile && <p>{profile.title}</p>}
            <span className="department-tag">{user.department}</span>
          </div>
          {overview && (
            <Link to="/profile/edit" className="secondary-button">
              {profile ? 'Edit profile' : 'Create profile'}
            </Link>
          )}
        </header>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="secondary-button" onClick={() => {
              setError('');
              setAttempt((value) => value + 1);
            }}>Try again</button>
          </>
        ) : !overview ? <p role="status">Loading your profile…</p> : (
          <div className="dashboard-grid">
            <section className="search-panel dashboard-panel" aria-labelledby="skill-profile-heading">
              <h2 id="skill-profile-heading">Skill profile</h2>
              {profile ? (
                <>
                  <h3>Skills</h3>
                  <ul className="skill-tags dashboard-list">
                    {profile.skills.map((skill) => <li className="skill-tag" key={skill}>{skill}</li>)}
                  </ul>
                  <h3>Experience</h3>
                  <p><strong>{profile.years}</strong> {profile.years === 1 ? 'year' : 'years'}</p>
                  <p className="dashboard-summary">{profile.description}</p>
                  <h3>Certifications</h3>
                  {profile.certifications.length ? (
                    <ul className="skill-tags dashboard-list">
                      {profile.certifications.map((certification) => <li className="skill-tag" key={certification}>{certification}</li>)}
                    </ul>
                  ) : <p>No certifications listed.</p>}
                  <h3>External reference links</h3>
                  {profile.links.length ? (
                    <ul className="dashboard-list profile-reference-list">
                      {profile.links.map((link, index) => (
                        <li key={index}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>
                      ))}
                    </ul>
                  ) : <p>No reference links listed.</p>}
                </>
              ) : <p>Create your profile to share your skills and experience in the directory.</p>}
            </section>
            <section className="search-panel dashboard-panel" aria-labelledby="recognition-heading">
              <h2 id="recognition-heading">Recognition</h2>
              {overview.recognition.length ? (
                <ul className="dashboard-list recognition-list">
                  {overview.recognition.map((award) => (
                    <li key={award.id}>
                      <h3>{award.title}</h3>
                      <time dateTime={award.awardedAt}>{award.awardedAt.slice(0, 10)}</time>
                      <p>{award.description}</p>
                    </li>
                  ))}
                </ul>
              ) : <p>No recognition received yet.</p>}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

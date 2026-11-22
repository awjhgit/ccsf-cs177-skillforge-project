import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError, type ProfileDetails } from '../services/api';
import type { User } from '../types/user';
import '../styles/ProfilePage.css';

interface ProfileEditPageProps {
  user: User;
  onSessionExpired: () => void;
}

const parseList = (value: FormDataEntryValue | null) =>
  String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);

export default function ProfileEditPage({ user, onSessionExpired }: ProfileEditPageProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [trustedHosts, setTrustedHosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [linkRows, setLinkRows] = useState<number[]>([]);
  const nextLinkRow = useRef(0);

  useEffect(() => {
    let cancelled = false;
    api.profile().then(({ profile, trustedReferenceHosts }) => {
      if (cancelled) return;
      setProfile(profile);
      setTrustedHosts(trustedReferenceHosts);
      setLinkRows(profile?.links.map((_, index) => index) ?? []);
      nextLinkRow.current = profile?.links.length ?? 0;
    }).catch((error) => {
      if (cancelled) return;
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      else setLoadError('Could not load your profile. Please try again.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [attempt, onSessionExpired]);

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setSaveError('');
    try {
      await api.saveProfile({
        title: String(fields.get('title')),
        description: String(fields.get('description')),
        years: Number(fields.get('years')),
        skills: parseList(fields.get('skills')),
        certifications: parseList(fields.get('certifications')),
        links: linkRows.map((id) => ({
          label: String(fields.get(`link-label-${id}`)),
          url: String(fields.get(`link-url-${id}`)),
        })),
      });
      navigate('/profile', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      else setSaveError(error instanceof ApiError ? error.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="skills-directory">
      <main className="page profile-page">
        <Link to="/profile">← My Profile</Link>
        <section className="page-heading">
          <h1>{profile ? 'Edit your profile' : 'Create your profile'}</h1>
          <p>Share your skills and experience with colleagues in the directory.</p>
        </section>
        {loading ? <p role="status">Loading your profile…</p> : loadError ? (
          <>
            <p role="alert">{loadError}</p>
            <button className="secondary-button" onClick={() => {
              setLoadError('');
              setLoading(true);
              setAttempt((value) => value + 1);
            }}>Try again</button>
          </>
        ) : (
          <form className="search-panel profile-form" onSubmit={save} aria-busy={saving}>
            <div>
              <strong>{user.name}</strong>
              <p>{user.department}</p>
            </div>
            <label>Job title
              <input name="title" required maxLength={100} defaultValue={profile?.title} />
            </label>
            <label>Years of experience
              <input name="years" type="number" required min={0} max={80} step={1} defaultValue={profile?.years} />
            </label>
            <label>Experience summary
              <textarea name="description" required rows={4} maxLength={1000} defaultValue={profile?.description} />
            </label>
            <label>Skills
              <input name="skills" required aria-describedby="profile-list-hint" defaultValue={profile?.skills.join(', ')} />
            </label>
            <label>Certifications (optional)
              <input name="certifications" aria-describedby="profile-list-hint" defaultValue={profile?.certifications.join(', ')} />
            </label>
            <p id="profile-list-hint">Separate entries with commas. You can add up to 20 per field.</p>
            <fieldset className="profile-reference-fields" disabled={saving}>
              <legend>External reference links (optional)</legend>
              <p>Add up to 10 HTTPS links from {trustedHosts.join(', ')}.</p>
              {linkRows.map((id, index) => (
                <div className="profile-reference-row" key={id}>
                  <label>Link {index + 1} label
                    <input name={`link-label-${id}`} required maxLength={80} defaultValue={profile?.links[id]?.label} />
                  </label>
                  <label>Link {index + 1} URL
                    <input name={`link-url-${id}`} type="url" required maxLength={1000}
                      placeholder="https://github.com/username" defaultValue={profile?.links[id]?.url} />
                  </label>
                  <button type="button" className="secondary-button" aria-label={`Remove link ${index + 1}`}
                    onClick={() => setLinkRows((rows) => rows.filter((row) => row !== id))}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="secondary-button" disabled={linkRows.length >= 10} onClick={() => {
                const id = nextLinkRow.current++;
                setLinkRows((rows) => [...rows, id]);
              }}>Add link</button>
            </fieldset>
            {saveError && <p role="alert" className="profile-error">{saveError}</p>}
            <div className="profile-actions">
              <Link to="/profile">Cancel</Link>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

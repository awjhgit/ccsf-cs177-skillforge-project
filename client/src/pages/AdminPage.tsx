
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../services/api";
import type { User } from "../types/user";

interface AdminPageProps {
  onLogout: () => Promise<void>;
  onSessionExpired: () => void;
}

export default function AdminPage({ onLogout, onSessionExpired }: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.department} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.users().then(({ users }) => {
      if (!cancelled) setUsers(users);
    }).catch((error: unknown) => {
      if (cancelled) return;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) onSessionExpired();
      else setError("Could not load accounts. Please try again.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt, onSessionExpired]);

  async function toggleAccount(id: number) {
    const account = users.find((user) => user.id === id);
    if (!account || pending || account.role === "Admin") return;
    const status = account.status === "Active" ? "Inactive" : "Active";
    const action = status === "Inactive" ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${account.name}?`)) return;
    setPending(true);
    setError("");
    try {
      const { users } = await api.setStatus(id, status);
      setUsers(users);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) onSessionExpired();
      else setError(error instanceof Error ? error.message : "Unable to save account changes.");
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    setError("");
    try { await onLogout(); }
    catch { setError("Could not log out. Please try again."); }
    finally { setPending(false); }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Skill Forge</h2>
        <h3>Admin Controls</h3>
        <nav aria-label="Admin navigation">
          <Link to="/search">Skills Directory</Link>
          <button className="nav-active">Account Management</button>
          <button disabled>User Profile Management (Coming Soon)</button>
          <button disabled>Defined Skills Management (Coming Soon)</button>
        </nav>
        <button className="logout-button" onClick={handleLogout} disabled={pending}>
          Log Out
        </button>
      </aside>

      <main className="admin-content">
        <header>
          <h1>Account Management</h1>
          <p>View and manage registered Skill Forge accounts.</p>
        </header>

        {loading && <p role="status">Loading accounts…</p>}
        {error && <div role="alert"><p>{error}</p><button onClick={() => { setLoading(true); setError(""); setAttempt((value) => value + 1); }} disabled={pending || loading}>Reload accounts</button></div>}

        {!loading && <>
        <section className="stats-grid">
          <div className="stat-card">
            <h3>Total Accounts</h3>
            <strong>{users.length}</strong>
          </div>
          <div className="stat-card">
            <h3>Active Accounts</h3>
            <strong>{users.filter((u) => u.status === "Active").length}</strong>
          </div>
          <div className="stat-card">
            <h3>Inactive Accounts</h3>
            <strong>{users.filter((u) => u.status === "Inactive").length}</strong>
          </div>
        </section>

        <section className="accounts-section">
          <h2>Registered Accounts</h2>

          <input
            className="search-input"
            type="search"
            placeholder="Search by name, email, department, or role..."
            aria-label="Search accounts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.department}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`status ${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-button"
                        disabled={pending || user.role === "Admin"}
                        onClick={() => toggleAccount(user.id)}
                      >
                        {user.status === "Active" ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6}>No matching accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        </>}
      </main>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../types/user";
import "./Header.css";

interface HeaderProps {
  currentUser: User;
  setLogoutError: React.Dispatch<React.SetStateAction<string>>;
  onLogout: () => Promise<void>;
}

export default function Header({
  currentUser,
  setLogoutError,
  onLogout,
}: HeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await onLogout();
    } catch {
      setLogoutError("Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="topbar">
      <Link className="brand" to="/directory" aria-label="Skill Forge home">
        <span className="brand-icon">✳</span>
        Skill Forge
      </Link>

      <nav className="navigation" aria-label="Main navigation">
        <Link className="active" to="/directory" aria-current="page">
          Directory
        </Link>
        <Link to="/profile">My Profile</Link>
        {currentUser.role === "Admin" && (
          <Link to="/admin">Account Management</Link>
        )}
        <button disabled title="Coming soon">
          My Connections
        </button>
        <button disabled title="Coming soon">
          Rewards
        </button>
        <button disabled title="Coming soon">
          Analytics
        </button>
      </nav>

      <div className="account">
        <span className="avatar initials" aria-hidden="true">
          {currentUser.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </span>
        <span>{currentUser.name}</span>
        <button
          className="logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out…" : "Log Out"}
        </button>
      </div>
    </header>
  );
}

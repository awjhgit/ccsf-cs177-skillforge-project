import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useRedirect } from "../../hooks/useRedirect";
import { getInitials } from "../../utils/user";
import type { User } from "../../types/user";
import "./Header.css";

interface HeaderProps {
  currentUser: User | null;
  setLogoutError: React.Dispatch<React.SetStateAction<string>> | null;
  onLogout: () => Promise<void>;
}

interface NavItem {
  label: string;
  to?: string;
  requiresAuth?: boolean;
  requiredRole?: User["role"];
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Search Profiles", to: "/search", requiresAuth: true },
  { label: "My Profile", to: "/profile", requiresAuth: true },
  {
    label: "Account Management",
    to: "/admin",
    requiresAuth: true,
    requiredRole: "Admin",
  },
  { label: "Badges", requiresAuth: true, disabled: true },
  { label: "Connections", requiresAuth: true, disabled: true },
  { label: "Feedback", requiresAuth: true, disabled: true },
];

function canViewNavItem(item: NavItem, user: User | null): boolean {
  if (item.requiresAuth && !user) return false;
  if (item.requiredRole && user?.role !== item.requiredRole) return false;
  return true;
}

export default function Header({
  currentUser,
  setLogoutError,
  onLogout,
}: HeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    canViewNavItem(item, currentUser),
  );

  async function handleLogout() {
    if (loggingOut || !currentUser) return;
    setLoggingOut(true);
    setLogoutError!("");
    try {
      await onLogout();
    } catch {
      setLogoutError!("Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const { goToLogin, goToRegister } = useRedirect();
  
  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Skill Forge home">
        <span className="brand-icon" aria-hidden="true">
          ✳
        </span>
        Skill Forge
      </Link>

      <nav className="navigation" aria-label="Main navigation">
        {visibleNavItems.map((item) =>
          item.disabled || !item.to ? (
            <button key={item.label} type="button" hidden title="Coming soon">
              {item.label}
            </button>
          ) : (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="account">
        {currentUser ? (
          <>
            <span className="avatar initials" aria-hidden="true">
              {getInitials(currentUser.name)}
            </span>
            <span>{currentUser.name}</span>
            <button
              type="button"
              className="secondary-button"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out…" : "Log Out"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={goToRegister}
            >
              Register
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={goToLogin}
            >
              Log In
            </button>
          </>
        )}
      </div>
    </header>
  );
}

import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RegisterPage from "./pages/RegisterPage";
import ProfileDashboard from "./pages/ProfileDashboard";
import ProfilePage from "./pages/ProfilePage";
import SkillSearchPage from "./pages/SkillSearchPage/SkillSearchPage";
import Footer from "./components/Footer/Footer";
import { api } from "./services/api";
import type { User } from "./types/user";
import "./styles/App.css";


export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .session()
      .then(({ user }) => {
        if (!cancelled) setCurrentUser(user);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Could not connect to Skill Forge. Check that the server is running.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const expireSession = useCallback(() => setCurrentUser(null), []);

  async function logout() {
    await api.logout();
    setCurrentUser(null);
  }

  if (loading)
    return (
      <main className="login-container">
        <p role="status" className="login-card">
          Loading Skill Forge…
        </p>
      </main>
    );

  if (error)
    return (
      <main className="login-container">
        <div className="login-card">
          <p role="alert">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      </main>
    );
  const authorized = currentUser?.status === "Active";

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              authorized ? (
                <Navigate to="/directory" replace />
              ) : (
                <LoginPage onLogin={setCurrentUser} />
              )
            }
          />
          <Route
            path="/register"
            element={
              authorized ? (
                <Navigate to="/directory" replace />
              ) : (
                <RegisterPage />
              )
            }
          />
          <Route
            path="/directory"
            element={
              authorized ? (
                <SkillSearchPage currentUser={currentUser} onLogout={logout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              authorized ? (
                <ProfileDashboard
                  user={currentUser}
                  onSessionExpired={expireSession}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile/edit"
            element={
              authorized ? (
                <ProfilePage
                  user={currentUser}
                  onSessionExpired={expireSession}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              authorized && currentUser.role === "Admin" ? (
                <AdminPage onLogout={logout} onSessionExpired={expireSession} />
              ) : (
                <Navigate to={authorized ? "/directory" : "/login"} replace />
              )
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={authorized ? "/directory" : "/login"} replace />
            }
          />
        </Routes>
      </BrowserRouter>
      <Footer />;
    </>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./hooks/useSession";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RegisterPage from "./pages/RegisterPage";
import ProfileDashboard from "./pages/ProfileDashboard";
import ProfilePage from "./pages/ProfilePage";
import SkillSearchPage from "./pages/SkillSearchPage/SkillSearchPage";
import Footer from "./components/Footer/Footer";
import "./styles/App.css";

export default function App() {
  const {
    currentUser,
    setCurrentUser,
    loading,
    error,
    retry,
    expireSession,
    logout,
  } = useSession();

  if (loading) {
    return (
      <main className="login-container">
        <p role="status" className="login-card">
          Loading Skill Forge…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="login-container">
        <div className="login-card">
          <p role="alert">{error}</p>
          <button onClick={retry}>Try again</button>
        </div>
      </main>
    );
  }

  const isActive = currentUser?.status === "Active";

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isActive ? (
              <Navigate to="/directory" replace />
            ) : (
              <LoginPage onLogin={setCurrentUser} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isActive ? <Navigate to="/directory" replace /> : <RegisterPage />
          }
        />
        <Route
          path="/directory"
          element={
            <ProtectedRoute user={currentUser}>
              <SkillSearchPage currentUser={currentUser!} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={currentUser}>
              <ProfileDashboard
                user={currentUser!}
                onSessionExpired={expireSession}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute user={currentUser}>
              <ProfilePage
                user={currentUser!}
                onSessionExpired={expireSession}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={currentUser} requiredRole="Admin">
              <AdminPage onLogout={logout} onSessionExpired={expireSession} />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={isActive ? "/directory" : "/login"} replace />}
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

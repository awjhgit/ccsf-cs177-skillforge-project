import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { useSession } from "./hooks/useSession";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header/Header";
import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileEditPage from "./pages/ProfileEditPage";
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

  const [logoutError, setLogoutError] = useState("");

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
      <Header
        currentUser={currentUser}
        setLogoutError={setLogoutError}
        onLogout={logout}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            isActive ? (
              <Navigate to="/search" replace />
            ) : (
              <LoginPage onLogin={setCurrentUser} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isActive ? <Navigate to="/search" replace /> : <RegisterPage />
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute user={currentUser}>
              <SkillSearchPage logoutError={logoutError} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
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
          path="/profile/edit"
          element={
            <ProtectedRoute user={currentUser}>
              <ProfileEditPage
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
          element={<Navigate to={isActive ? "/search" : "/login"} replace />}
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

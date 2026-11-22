import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import type { User } from "../types/user";

const CONNECTION_ERROR =
  "Could not connect to Skill Forge. Check that the server is running.";

export function useSession() {
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
        if (!cancelled) setError(CONNECTION_ERROR);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError("");
    setAttempt((value) => value + 1);
  }, []);

  const expireSession = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    setCurrentUser,
    loading,
    error,
    retry,
    expireSession,
    logout,
  };
}

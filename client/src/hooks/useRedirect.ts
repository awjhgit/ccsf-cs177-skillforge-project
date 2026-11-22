import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useRedirect() {
  const navigate = useNavigate();

  const goToLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const goToRegister = useCallback(() => {
    navigate("/register");
  }, [navigate]);

  return { goToLogin, goToRegister };
}

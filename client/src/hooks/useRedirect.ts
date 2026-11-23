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
  
  const goToSearch = useCallback(() => {
    navigate("/search");
  }, [navigate]);

  const goToProfile = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  return { goToLogin, goToRegister, goToSearch, goToProfile};
}

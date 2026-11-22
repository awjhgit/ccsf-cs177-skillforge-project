import { useRedirect } from "../../hooks/useRedirect";
import "./HomePage.css";

export default function HomePage() {
  const { goToLogin, goToRegister } = useRedirect();

  return (
    <div className="home-page">
      <div className="page-hero">
        The internal network for sharing skills, finding mentors, and getting
        work done!
      </div>
      <div className="home-buttons">
        <button className="button login-button" onClick={goToLogin}>
          Login
        </button>
        <button className="button register-button" onClick={goToRegister}>
          Register
        </button>
      </div>
      <div className="subhead">
        Skill Forge is a peer-to-peer marketplace dedicated to making skill
        sharing and mentorship accessible to everyone. We believe the power of
        direct connections foster growth and opportunity.
      </div>
    </div>
  );
}

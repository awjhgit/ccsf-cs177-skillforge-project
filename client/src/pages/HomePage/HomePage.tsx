import { useRedirect } from "../../hooks/useRedirect";
import type { User } from "../../types/user";
import "./HomePage.css";

interface HomePageProps {
  currentUser: User | null;
}

export default function HomePage({ currentUser }: HomePageProps) {
  const { goToLogin, goToRegister, goToSearch, goToProfile } = useRedirect();

  return (
    <div className="home-page">
      <div className="page-hero">
        The internal network for sharing skills, finding mentors, and getting
        work done!
      </div>
      <div className="home-buttons">
        <button
          className="button blue-button"
          onClick={currentUser ? goToSearch : goToLogin}
        >
          {currentUser ? "Search for Profiles" : "Log In"}
        </button>
        <button
          className="button white-button"
          onClick={currentUser ? goToProfile : goToRegister}
        >
          {currentUser ? "View My Profile" : "Register"}
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

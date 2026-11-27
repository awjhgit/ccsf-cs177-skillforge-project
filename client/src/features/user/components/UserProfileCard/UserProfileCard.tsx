import { type UserProfile, getFullName, getNameInitials } from "../../index";
import "./UserProfileCard.css";

interface UserProfileCardProps {
  profile: UserProfile | null;
  onConnect?: () => void;
}

export default function UserProfileCard({
  profile,
  onConnect,
}: UserProfileCardProps) {

  if (!profile) {
    return (
      <section className="profile-card-container">
        <p>Select a user to view profile details.</p>
      </section>
    );
  }

  return (
    <section className="profile-card-container">
      <div className="profile-card-header">
        <div className="profile-avatar">{getNameInitials(profile.name)}</div>
        <div className="profile-name">{getFullName(profile.name)}</div>
      </div>
      <div className="profile-skill-tags-container">
        {profile.skills.map((skill) => (
          <span key={skill} className="profile-skill-tag">
            {skill}
          </span>
        ))}
      </div>
      <div className="profile-description">{profile.description}</div>
      <div className="profile-card-footer">
        <div className="profile-external-links">
          {profile.links.map((link, index) => (
            <a
              href={link.url}
              key={index}
              target="_blank"
              rel="noreferrer"
              aria-label={`${profile.name}: ${link.label}`}
              title={link.label}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="card-buttons">
        <button
          type="button"
          className="profile-button view-profile-button"
          onClick={() => {}}
        >
          View Profile
        </button>
        <button
          type="button"
          className="profile-button connect-button"
          onClick={onConnect}
        >
          Connect
        </button>
      </div>
    </section>
  );
}

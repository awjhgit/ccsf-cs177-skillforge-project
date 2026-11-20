import type { DirectoryProfile } from "../../services/api";
import "./ProfileCard.css";

interface ProfileCardProps {
    employee: DirectoryProfile;
    setSelectedEmployee: React.Dispatch<React.SetStateAction<DirectoryProfile | null>>;
}


export default function ProfileCard({employee, setSelectedEmployee}: ProfileCardProps) {
  return (
    <article className="profile-card" key={employee.id}>
      <div className="profile-card-header">
        <div className="avatar">
          {employee.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </div>
        <div className="identity">
          <h3>{employee.name}</h3>
          <p>{employee.title}</p>
          <span className="department-tag">{employee.department}</span>
        </div>
      </div>

      <div className="skill-tags">
        {employee.skills.map((skill) => (
          <span className="skill-tag" key={skill}>
            {skill}
          </span>
        ))}
      </div>

      <p className="experience-description">{employee.description}</p>

      <div className="profile-details">
        <span>
          <strong>{employee.years} yrs</strong> experience
        </span>
        {employee.certifications.length > 0 && (
          <span
            className="certification"
            title={employee.certifications.join(", ")}
          >
            ✧ {employee.certifications[0]}
          </span>
        )}
      </div>

      <div className="card-footer">
        <div className="external-links">
          {employee.links.map((link, index) => (
            <a
              href={link.url}
              key={index}
              target="_blank"
              rel="noreferrer"
              aria-label={`${employee.name}: ${link.label}`}
              title={link.label}
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          className="secondary-button"
          onClick={() => setSelectedEmployee(employee)}
        >
          View Profile
        </button>
      </div>
    </article>
  );
}

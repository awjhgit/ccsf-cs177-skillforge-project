import { type DirectoryProfile } from "../../../services/api";
import "./ProfileModal.css"

interface ProfileModalProps {
  profileDialog: React.RefObject<HTMLDialogElement | null>;
  setSelectedEmployee: (value: React.SetStateAction<DirectoryProfile|null>) => void;
  selectedEmployee: DirectoryProfile;
}

export default function ProfileModal({
  profileDialog,
  setSelectedEmployee,
  selectedEmployee,
}: ProfileModalProps) {
  function closeProfile() {
    profileDialog.current?.close();
    setSelectedEmployee(null);
  }

  return (
    <dialog
      ref={profileDialog}
      className="profile-modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        closeProfile();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          closeProfile();
      }}
    >
      <button
        className="modal-close"
        onClick={closeProfile}
        aria-label="Close profile"
      >
        ×
      </button>

      <div className="modal-profile-header">
        <div className="avatar large">
          {selectedEmployee.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </div>
        <div>
          <h2 id="modal-title">{selectedEmployee.name}</h2>
          <p>{selectedEmployee.title}</p>
          <span className="department-tag">{selectedEmployee.department}</span>
        </div>
      </div>

      <h3>Skills and expertise</h3>
      <div className="skill-tags">
        {selectedEmployee.skills.map((skill) => (
          <span className="skill-tag" key={skill}>
            {skill}
          </span>
        ))}
      </div>

      <h3>Experience</h3>
      <p>{selectedEmployee.description}</p>
      <p>
        <strong>{selectedEmployee.years} years</strong> of reported experience.
      </p>

      <h3>Certifications</h3>
      <p>
        {selectedEmployee.certifications.join(", ") ||
          "No certifications listed."}
      </p>

      <h3>External profiles</h3>
      <div className="modal-links">
        {selectedEmployee.links.map((link, index) => (
          <a href={link.url} target="_blank" rel="noreferrer" key={index}>
            {link.label} ↗
          </a>
        ))}
      </div>

      <button
        className="primary-button modal-action"
        onClick={() =>
          window.alert(
            "Connection requests will be implemented in the next phase.",
          )
        }
      >
        Request Connection
      </button>
    </dialog>
  );
}

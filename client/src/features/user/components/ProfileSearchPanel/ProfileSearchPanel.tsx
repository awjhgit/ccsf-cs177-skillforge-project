import type { SubmitEvent } from "react";
import ProfileFilterSelectBar from "../ProfileFilterSelectBar/ProfileFilterSelectBar";
import "./ProfileSearchPanel.css";

interface ProfileSearchPanelProps {
  skillsDirectory: string[];
}

export default function ProfileSearchPanel({
  skillsDirectory,
}: ProfileSearchPanelProps) {
  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    // prevent default refresh behavior of submit
    event.preventDefault();
  };

  return (
    <section className="profile-search-panel">
      <div className="prompt-search">
        <p className="search-section-header">Prompt Search</p>
        <form className="search-prompt-form" onSubmit={onSubmit}>
          <div className="search-bar-container">
            <span className="search-bar-mag-img" aria-hidden="true">
              ⌕
            </span>
            <input
              className="search-bar-input"
              type="search"
              placeholder="Search for skills"
            />
          </div>
        </form>
      </div>
      <div className="directory-search">
        <p className="search-section-header">Skills Directory</p>
        <div className="search-bar-container">
          <span className="search-bar-mag-img" aria-hidden="true">
            ⌕
          </span>
          <input
            className="search-bar-input"
            type="search"
            placeholder="Filter skills directory"
          />
        </div>
        <div className="skill-directory-filter-container">
          <ProfileFilterSelectBar
            filters={{ skills: [] }}
            availableSkills={skillsDirectory}
            hasActiveFilters={true}
            onToggleSkill={() => {}}
            onReset={() => {}}
          />
        </div>
      </div>
      <div className="search-button-container">
        <button className="search-button" type="submit">
          Search
        </button>
      </div>
    </section>
  );
}

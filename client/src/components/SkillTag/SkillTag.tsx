import "./SkillTag.css";

interface SkillTagProps {
  skillName: string;
}

export default function SkillTag({ skillName }: SkillTagProps) {
  return <span className="skill-tag">{skillName}</span>;
}

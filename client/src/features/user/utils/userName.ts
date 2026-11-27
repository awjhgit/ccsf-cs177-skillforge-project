import type { Name } from "../types";

const DEFAULT_MIDDLE_NAME = "";

export function getFullName(name: Name) {
  // set middle name to "" if its not defined
  const middle = name.middle ?? DEFAULT_MIDDLE_NAME;

  const nameInParts = [
    name.first.trim() ?? "",
    middle.trim() ?? "",
    name.last.trim() ?? "",
  ].filter(Boolean);

  return nameInParts.join(" ");
}

export function getNameInitials(name: Name) {
  // set middle name to "" if its not defined
  const middle = name.middle ?? DEFAULT_MIDDLE_NAME;

  const f = name.first.trim()[0] ?? "";
  const m = middle.trim()[0] ?? "";
  const l = name.last.trim()[0] ?? "";
  return f + m + l;
}

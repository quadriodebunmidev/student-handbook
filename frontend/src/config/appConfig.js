export const APP_CONFIG = {
  name: "LectureVault",
  shortName: "LV",
  tagline: "Your course materials, organized.",
};

export const DEPARTMENTS = ["Computer Science", "Mathematics", "Accounting", "Mass Communication"];
export const LEVELS = [100, 200, 300, 400];
export const SEMESTERS = ["First Semester", "Second Semester"];

// Academic sessions are generated as a rolling window (e.g. "2025/2026") so
// the dropdown never goes stale — no need to hardcode a new year every time.
export function getAcademicSessions(count = 6) {
  const now = new Date();
  // Nigerian academic sessions typically start around September.
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const sessions = [];
  for (let i = 0; i < count; i++) {
    const y = startYear + 1 - i; // include the upcoming session first
    sessions.push(`${y}/${y + 1}`);
  }
  return sessions;
}

export const SESSIONS = getAcademicSessions();

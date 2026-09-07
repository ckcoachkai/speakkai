export const courseEditorialFields = {
  introduction: "Course introduction",
  worldsIntro: "Why the topics matter",
  rolesIntro: "Why practise a role",
  feedbackIntro: "Introduce the feedback example",
  practiceOpening: "Fictional practice — opening sentence",
  practiceEnding: "Fictional practice — final sentence",
  example: "Illustrative feedback quote",
  retry: "What the learner tries next",
  decideIntro: "Guidance before an inquiry",
};

export function validateCourseEditorial(record) {
  if (!record || typeof record !== "object") throw new Error("Course editorial content is missing");
  for (const language of ["en", "zh-CN"]) {
    const copy = record[language];
    if (!copy || typeof copy !== "object") throw new Error(`Course translation missing: ${language}`);
    if (Object.keys(copy).sort().join() !== Object.keys(courseEditorialFields).sort().join()) {
      throw new Error(`Course translation fields differ: ${language}`);
    }
    for (const key of Object.keys(courseEditorialFields)) {
      const value = copy[key];
      if (typeof value !== "string" || value.trim().length < 10 || value.length > 700) {
        throw new Error(`Course ${language}.${key} must contain 10–700 characters`);
      }
    }
  }
  const date = record.reviewedOn;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error("Course editorial review date is invalid");
  }
  if (typeof record.editorialNote !== "string" || record.editorialNote.trim().length < 10) {
    throw new Error("Course editorial source/review note is required");
  }
}

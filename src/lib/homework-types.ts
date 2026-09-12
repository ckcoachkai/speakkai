export type Homework = { title: string; steps: string[]; prepareFor: string; note?: string };
export type StudentFeedbackLink = { name: string; feedbackUrl: string | null };
export type ClassSession = {
  id: string;
  date: string;
  time: string;
  students: StudentFeedbackLink[];
  classContent: string[];
  homework: Homework | null;
};
export type ClassGroup = { id: string; sessions: ClassSession[] };
export type HomeworkDocument = { version: number; updatedAt: string; timeZone: string; classes: ClassGroup[] };

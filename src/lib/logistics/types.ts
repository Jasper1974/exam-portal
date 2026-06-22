export type LogisticsSubmissionRecord = {
  id: string;
  studentName: string;
  studentId: string;
  examId: string;
  examType: string;
  examTitle?: string | null;
  sourceFile?: string | null;
  examSnapshot?: unknown;
  totalScore?: number | null;
  answers: Record<string, string>;
  status: string;
  result?: unknown;
  teacherGrade?: unknown;
  submittedAt: string;
};

export type QuestionType = "single" | "multiple" | "text";

export type ChoiceOption = {
  key: string;
  label: string;
};

export type ExamQuestion = {
  id: string;
  orderIndex: number;
  type: QuestionType;
  stem: string;
  options: ChoiceOption[] | null;
  maxScore: number;
};

export type ExamSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  questionCount: number;
};

export type ExamDetail = ExamSummary & {
  questions: ExamQuestion[];
};

export type SubmissionAnswerMap = Record<string, string | string[]>;

export type GradeItem = {
  questionId: string;
  score: number;
  maxScore: number;
  comment: string;
};

export type GradeResult = {
  totalScore: number;
  maxScore: number;
  items: GradeItem[];
  summary: string;
};

import { prisma } from "@/lib/db/prisma";
import type {
  ExamDetail,
  ExamQuestion,
  ExamSummary,
  GradeResult,
  SubmissionAnswerMap,
} from "@/lib/types";
import type { ChoiceOption } from "@/lib/types";
import { callLLM } from "@/lib/llm/router";

function mapQuestion(row: {
  id: string;
  orderIndex: number;
  type: string;
  stem: string;
  options: unknown;
  maxScore: number;
}): ExamQuestion {
  return {
    id: row.id,
    orderIndex: row.orderIndex,
    type: row.type as ExamQuestion["type"],
    stem: row.stem,
    options: (row.options as ChoiceOption[] | null) ?? null,
    maxScore: row.maxScore,
  };
}

export async function listPublishedExams(): Promise<ExamSummary[]> {
  const rows = await prisma.exam.findMany({
    where: { isPublished: true },
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    durationMinutes: row.durationMinutes,
    questionCount: row._count.questions,
  }));
}

export async function getPublishedExamBySlug(
  slug: string,
): Promise<ExamDetail | null> {
  const row = await prisma.exam.findFirst({
    where: { slug, isPublished: true },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    durationMinutes: row.durationMinutes,
    questionCount: row.questions.length,
    questions: row.questions.map(mapQuestion),
  };
}

function gradeChoice(
  type: "single" | "multiple",
  answer: string | string[] | undefined,
  correct: string | string[] | null,
  maxScore: number,
): { score: number; comment: string } {
  if (!correct) return { score: 0, comment: "未配置标准答案" };

  const normalized = Array.isArray(answer)
    ? [...answer].sort().join(",")
    : (answer ?? "").trim();

  const expected = Array.isArray(correct)
    ? [...correct].sort().join(",")
    : String(correct).trim();

  if (!normalized) return { score: 0, comment: "未作答" };

  const ok = normalized === expected;
  return {
    score: ok ? maxScore : 0,
    comment: ok
      ? "回答正确"
      : type === "single"
        ? `正确答案：${expected}`
        : `正确答案：${expected}`,
  };
}

async function gradeTextQuestion(input: {
  stem: string;
  rubric: string | null;
  answer: string | undefined;
  maxScore: number;
}): Promise<{ score: number; comment: string }> {
  const text = (input.answer ?? "").trim();
  if (!text) return { score: 0, comment: "未作答" };

  const rubric =
    input.rubric ??
    "按要点完整性、逻辑性与表述准确性评分，满分即全部要点覆盖且表述清楚。";

  try {
    const { content } = await callLLM({
      task: "grade_essay",
      jsonMode: true,
      messages: [
        {
          role: "system",
          content:
            "你是严谨的课程助教。只输出 JSON，不要 markdown。格式：{\"score\": number, \"comment\": string}。score 为 0 到满分的整数或一位小数。",
        },
        {
          role: "user",
          content: `题目：${input.stem}\n满分：${input.maxScore}\n评分标准：${rubric}\n学生答案：${text}`,
        },
      ],
    });

    const parsed = JSON.parse(content) as { score?: number; comment?: string };
    const score = Math.min(
      input.maxScore,
      Math.max(0, Number(parsed.score ?? 0)),
    );
    return {
      score,
      comment: parsed.comment?.trim() || "已自动评分",
    };
  } catch {
    return {
      score: Math.round(input.maxScore * 0.6),
      comment: "自动评分暂不可用，已给予中间分，请教师复核",
    };
  }
}

export async function gradeSubmission(
  examId: string,
  answers: SubmissionAnswerMap,
): Promise<GradeResult> {
  const questions = await prisma.question.findMany({
    where: { examId },
    orderBy: { orderIndex: "asc" },
  });

  const items = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += q.maxScore;
    const rawAnswer = answers[q.id];

    if (q.type === "single" || q.type === "multiple") {
      const result = gradeChoice(
        q.type,
        rawAnswer,
        q.correctAnswer as string | string[] | null,
        q.maxScore,
      );
      items.push({
        questionId: q.id,
        score: result.score,
        maxScore: q.maxScore,
        comment: result.comment,
      });
      totalScore += result.score;
      continue;
    }

    const result = await gradeTextQuestion({
      stem: q.stem,
      rubric: q.rubric,
      answer: typeof rawAnswer === "string" ? rawAnswer : undefined,
      maxScore: q.maxScore,
    });
    items.push({
      questionId: q.id,
      score: result.score,
      maxScore: q.maxScore,
      comment: result.comment,
    });
    totalScore += result.score;
  }

  return {
    totalScore,
    maxScore,
    items,
    summary: `共 ${questions.length} 题，得分 ${totalScore}/${maxScore}`,
  };
}

export async function createSubmission(input: {
  examSlug: string;
  studentName: string;
  studentId: string;
  answers: SubmissionAnswerMap;
}) {
  const exam = await prisma.exam.findFirst({
    where: { slug: input.examSlug, isPublished: true },
  });
  if (!exam) throw new Error("试卷不存在或未发布");

  const existing = await prisma.submission.findUnique({
    where: {
      examId_studentId: { examId: exam.id, studentId: input.studentId },
    },
  });
  if (existing) throw new Error("该学号已提交过本试卷，不可重复作答");

  const submission = await prisma.submission.create({
    data: {
      examId: exam.id,
      studentName: input.studentName,
      studentId: input.studentId,
      answers: input.answers,
      status: "grading",
    },
  });

  try {
    const grade = await gradeSubmission(exam.id, input.answers);
    return prisma.submission.update({
      where: { id: submission.id },
      data: {
        score: grade.totalScore,
        maxScore: grade.maxScore,
        status: "graded",
        feedback: grade,
      },
    });
  } catch (error) {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "failed" },
    });
    throw error;
  }
}

export async function getSubmissionForStudent(id: string, studentId: string) {
  return prisma.submission.findFirst({
    where: { id, studentId },
    include: { exam: { select: { title: true, slug: true } } },
  });
}

export async function listSubmissionsForAdmin(examSlug?: string) {
  return prisma.submission.findMany({
    where: examSlug ? { exam: { slug: examSlug } } : undefined,
    include: { exam: { select: { title: true, slug: true } } },
    orderBy: { submittedAt: "desc" },
  });
}

export async function listAllExamsForAdmin() {
  return prisma.exam.findMany({
    include: { _count: { select: { questions: true, submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
}

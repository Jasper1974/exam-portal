import { NextResponse } from "next/server";
import { createSubmission } from "@/lib/exams";
import { submitExamSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitExamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "提交数据无效" },
        { status: 400 },
      );
    }

    const submission = await createSubmission(parsed.data);

    return NextResponse.json({
      submissionId: submission.id,
      status: submission.status,
      score: submission.score,
      maxScore: submission.maxScore,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "提交失败，请稍后重试";
    const status = message.includes("已提交") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

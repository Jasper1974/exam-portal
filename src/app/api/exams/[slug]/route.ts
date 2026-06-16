import { NextResponse } from "next/server";
import { getPublishedExamBySlug } from "@/lib/exams";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  try {
    const exam = await getPublishedExamBySlug(slug);
    if (!exam) {
      return NextResponse.json({ error: "试卷不存在" }, { status: 404 });
    }
    return NextResponse.json({ exam });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "加载试卷失败" }, { status: 500 });
  }
}

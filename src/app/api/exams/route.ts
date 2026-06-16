import { NextResponse } from "next/server";
import { listPublishedExams } from "@/lib/exams";

export async function GET() {
  try {
    const exams = await listPublishedExams();
    return NextResponse.json({ exams });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "无法加载试卷列表，请检查数据库连接" },
      { status: 500 },
    );
  }
}

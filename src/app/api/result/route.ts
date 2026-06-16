import { NextResponse } from "next/server";
import { getSubmissionForStudent } from "@/lib/exams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const studentId = searchParams.get("studentId");

  if (!id || !studentId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  try {
    const submission = await getSubmissionForStudent(id, studentId);
    if (!submission) {
      return NextResponse.json({ error: "未找到成绩记录" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

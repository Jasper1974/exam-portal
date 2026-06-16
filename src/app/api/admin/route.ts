import { NextResponse } from "next/server";
import {
  listAllExamsForAdmin,
  listSubmissionsForAdmin,
} from "@/lib/exams";

function unauthorized() {
  return NextResponse.json({ error: "管理口令错误" }, { status: 401 });
}

export async function GET(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const examSlug = searchParams.get("examSlug") ?? undefined;

  try {
    const [exams, submissions] = await Promise.all([
      listAllExamsForAdmin(),
      listSubmissionsForAdmin(examSlug),
    ]);

    return NextResponse.json({ exams, submissions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}

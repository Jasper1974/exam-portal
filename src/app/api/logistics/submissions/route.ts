import { corsHeaders, jsonWithCors, optionsResponse } from "@/lib/logistics/cors";
import {
  isLogisticsStoreConfigured,
  listLogisticsSubmissions,
  listLogisticsSubmissionsByStudentId,
} from "@/lib/logistics/store";

function unauthorized(request: Request) {
  return jsonWithCors(request, { error: "管理口令错误" }, 401);
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: Request) {
  if (!isLogisticsStoreConfigured()) {
    return jsonWithCors(
      request,
      { error: "服务器存储未配置" },
      503,
    );
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim();

  try {
    if (studentId) {
      const submissions = await listLogisticsSubmissionsByStudentId(studentId);
      return jsonWithCors(request, { submissions });
    }

    const secret = request.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return unauthorized(request);
    }

    const submissions = await listLogisticsSubmissions();
    return jsonWithCors(request, { submissions });
  } catch (error) {
    console.error(error);
    return jsonWithCors(request, { error: "读取失败" }, 500);
  }
}

export async function POST() {
  return new Response(null, {
    status: 405,
    headers: corsHeaders(new Request("http://local")),
  });
}

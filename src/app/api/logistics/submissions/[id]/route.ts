import { z } from "zod";
import { corsHeaders, jsonWithCors, optionsResponse } from "@/lib/logistics/cors";
import {
  getLogisticsSubmissionById,
  isLogisticsStoreConfigured,
  upsertLogisticsSubmission,
} from "@/lib/logistics/store";

const updateSchema = z.object({
  status: z.string().optional(),
  result: z.unknown().optional(),
  teacherGrade: z.unknown().optional(),
});

function unauthorized(request: Request) {
  return jsonWithCors(request, { error: "管理口令错误" }, 401);
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isLogisticsStoreConfigured()) {
    return jsonWithCors(request, { error: "服务器存储未配置" }, 503);
  }

  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return unauthorized(request);
  }

  try {
    const { id } = await context.params;
    const existing = await getLogisticsSubmissionById(id);
    if (!existing) {
      return jsonWithCors(request, { error: "答卷不存在" }, 404);
    }

    const patch = updateSchema.parse(await request.json());
    const saved = await upsertLogisticsSubmission({
      ...existing,
      ...patch,
      status: patch.status ?? existing.status,
      result: patch.result ?? existing.result,
      teacherGrade: patch.teacherGrade ?? existing.teacherGrade,
    });

    return jsonWithCors(request, { ok: true, submission: saved });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return jsonWithCors(request, { error: "更新格式不正确" }, 400);
    }
    return jsonWithCors(request, { error: "保存失败" }, 500);
  }
}

export async function GET() {
  return new Response(null, {
    status: 405,
    headers: corsHeaders(new Request("http://local")),
  });
}

import { z } from "zod";
import { corsHeaders, jsonWithCors, optionsResponse } from "@/lib/logistics/cors";
import {
  isLogisticsStoreConfigured,
  upsertLogisticsSubmission,
} from "@/lib/logistics/store";

const submissionSchema = z.object({
  id: z.string().min(1),
  studentName: z.string().min(1),
  studentId: z.string().min(1),
  examId: z.string().min(1),
  examType: z.string().min(1),
  examTitle: z.string().nullable().optional(),
  sourceFile: z.string().nullable().optional(),
  examSnapshot: z.unknown().optional(),
  totalScore: z.number().nullable().optional(),
  answers: z.record(z.string(), z.string()),
  status: z.string().min(1),
  result: z.unknown().optional(),
  teacherGrade: z.unknown().optional(),
  submittedAt: z.string().min(1),
});

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  if (!isLogisticsStoreConfigured()) {
    return jsonWithCors(
      request,
      { error: "服务器存储未配置，请在 Vercel 连接 Blob/Upstash 或设置 GITHUB_SUBMISSIONS_TOKEN。" },
      503,
    );
  }

  try {
    const payload = submissionSchema.parse(await request.json());
    const saved = await upsertLogisticsSubmission(payload);
    return jsonWithCors(request, { ok: true, submission: saved });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return jsonWithCors(request, { error: "答卷格式不正确" }, 400);
    }
    return jsonWithCors(request, { error: "上传失败，请稍后重试" }, 500);
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: corsHeaders(new Request("http://local")),
  });
}

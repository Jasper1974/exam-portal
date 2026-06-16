import Link from "next/link";
import { listPublishedExams } from "@/lib/exams";

export default async function HomePage() {
  let exams: Awaited<ReturnType<typeof listPublishedExams>> = [];
  let dbError = false;

  try {
    exams = await listPublishedExams();
  } catch {
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-600">
              Exam Portal
            </p>
            <h1 className="text-xl font-bold text-slate-900">在线期末考试</h1>
          </div>
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            教师入口
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            考生须知
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            <li>进入考试前请填写真实姓名与 12 位数字学号。</li>
            <li>每份试卷每位考生仅可提交一次，请确认后交卷。</li>
            <li>选择题自动判分；简答题由 AI 辅助评分，教师可复核。</li>
            <li>本系统面向国内网络环境，无需 VPN。</li>
          </ul>
        </section>

        {dbError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            数据库未连接。教师请先配置 DATABASE_URL 并执行迁移与种子数据。
          </div>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">可参加的考试</h2>
          {exams.length === 0 ? (
            <p className="text-sm text-slate-500">暂无已发布的试卷。</p>
          ) : (
            exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/exam/${exam.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                    {exam.description ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {exam.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    进入考试 →
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {exam.questionCount} 题 · 限时 {exam.durationMinutes} 分钟
                </p>
              </Link>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

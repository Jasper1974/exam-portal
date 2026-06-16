"use client";

import { useState } from "react";
import Link from "next/link";

type ExamRow = {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  _count: { questions: number; submissions: number };
};

type SubmissionRow = {
  id: string;
  studentName: string;
  studentId: string;
  score: number | null;
  maxScore: number | null;
  status: string;
  submittedAt: string;
  exam: { title: string; slug: string };
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData(adminSecret: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-secret": adminSecret },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setExams(data.exams);
      setSubmissions(data.submissions);
      setAuthed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "验证失败");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const header = ["试卷", "姓名", "学号", "得分", "满分", "状态", "提交时间"];
    const rows = submissions.map((s) => [
      s.exam.title,
      s.studentName,
      s.studentId,
      s.score ?? "",
      s.maxScore ?? "",
      s.status,
      new Date(s.submittedAt).toLocaleString("zh-CN"),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-submissions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">教师管理后台</h1>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            学生端首页
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!authed ? (
          <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 font-semibold">输入管理口令</h2>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ADMIN_SECRET"
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={loading || !secret}
              onClick={() => loadData(secret)}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "验证中…" : "进入后台"}
            </button>
          </section>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 font-semibold">试卷列表</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-2 pr-4">标题</th>
                      <th className="py-2 pr-4">Slug</th>
                      <th className="py-2 pr-4">题数</th>
                      <th className="py-2 pr-4">提交数</th>
                      <th className="py-2">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4">{exam.title}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{exam.slug}</td>
                        <td className="py-2 pr-4">{exam._count.questions}</td>
                        <td className="py-2 pr-4">{exam._count.submissions}</td>
                        <td className="py-2">
                          {exam.isPublished ? "已发布" : "草稿"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                修改题目请编辑 prisma/seed.ts 后执行 npm run db:seed，或后续扩展在线出题功能。
              </p>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">提交记录</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadData(secret)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  >
                    刷新
                  </button>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
                  >
                    导出 CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-2 pr-4">试卷</th>
                      <th className="py-2 pr-4">姓名</th>
                      <th className="py-2 pr-4">学号</th>
                      <th className="py-2 pr-4">得分</th>
                      <th className="py-2">提交时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          暂无提交
                        </td>
                      </tr>
                    ) : (
                      submissions.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="py-2 pr-4">{s.exam.title}</td>
                          <td className="py-2 pr-4">{s.studentName}</td>
                          <td className="py-2 pr-4 font-mono">{s.studentId}</td>
                          <td className="py-2 pr-4">
                            {s.score ?? "—"}/{s.maxScore ?? "—"}
                          </td>
                          <td className="py-2">
                            {new Date(s.submittedAt).toLocaleString("zh-CN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

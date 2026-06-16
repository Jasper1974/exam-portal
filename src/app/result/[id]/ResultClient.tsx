"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { GradeResult } from "@/lib/types";

type Submission = {
  id: string;
  studentName: string;
  studentId: string;
  score: number | null;
  maxScore: number | null;
  status: string;
  feedback: GradeResult | null;
  exam: { title: string; slug: string };
};

export default function ResultClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? "";

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/result?id=${params.id}&studentId=${encodeURIComponent(studentId)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "查询失败");
        setSubmission(data.submission);
      } catch (e) {
        setError(e instanceof Error ? e.message : "查询失败");
      } finally {
        setLoading(false);
      }
    }
    if (params.id && studentId) load();
    else {
      setError("缺少学号参数");
      setLoading(false);
    }
  }, [params.id, studentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        加载成绩中…
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-600">{error || "未找到记录"}</p>
        <Link href="/" className="mt-4 inline-block text-blue-600">
          返回首页
        </Link>
      </div>
    );
  }

  const feedback = submission.feedback;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-blue-600">交卷成功</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {submission.exam.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {submission.studentName} · 学号 {submission.studentId}
          </p>

          <div className="mt-6 rounded-xl bg-blue-50 p-5">
            <p className="text-sm text-blue-800">总分</p>
            <p className="text-3xl font-bold text-blue-900">
              {submission.score ?? "—"} / {submission.maxScore ?? "—"}
            </p>
            <p className="mt-1 text-xs text-blue-700">
              状态：{submission.status === "graded" ? "已评分" : submission.status}
            </p>
          </div>

          {feedback?.items?.length ? (
            <div className="mt-6 space-y-3">
              <h2 className="font-semibold text-slate-900">各题得分</h2>
              {feedback.items.map((item, i) => (
                <div
                  key={item.questionId}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                >
                  <div className="flex justify-between font-medium">
                    <span>第 {i + 1} 题</span>
                    <span>
                      {item.score}/{item.maxScore}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">{item.comment}</p>
                </div>
              ))}
            </div>
          ) : null}

          <p className="mt-6 text-xs text-slate-500">
            简答题由 AI 辅助评分，如有异议请联系任课教师复核。
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            返回首页
          </Link>
        </section>
      </main>
    </div>
  );
}

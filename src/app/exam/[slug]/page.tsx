"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ExamPaper } from "@/components/ExamPaper";
import { StudentIdentityForm } from "@/components/StudentIdentityForm";
import type { ExamDetail } from "@/lib/types";

type Step = "identity" | "exam" | "submitting";

export default function ExamPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [step, setStep] = useState<Step>("identity");
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/exams/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "加载失败");
        setExam(data.exam);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载试卷失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        setRemaining("00:00");
        clearInterval(timer);
        return;
      }
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setRemaining(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const unanswered = useMemo(() => {
    if (!exam) return 0;
    return exam.questions.filter((q) => {
      const a = answers[q.id];
      if (q.type === "multiple") return !Array.isArray(a) || a.length === 0;
      return !a || (typeof a === "string" && !a.trim());
    }).length;
  }, [exam, answers]);

  function startExam(identity: { studentName: string; studentId: string }) {
    setStudentName(identity.studentName);
    setStudentId(identity.studentId);
    setStep("exam");
    if (exam) {
      setDeadline(Date.now() + exam.durationMinutes * 60 * 1000);
    }
  }

  async function handleSubmit() {
    if (!exam) return;
    if (unanswered > 0) {
      const ok = window.confirm(`还有 ${unanswered} 题未作答，确定交卷吗？`);
      if (!ok) return;
    }

    setStep("submitting");
    setError("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examSlug: slug,
          studentName,
          studentId,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "提交失败");

      router.push(
        `/result/${data.submissionId}?studentId=${encodeURIComponent(studentId)}`,
      );
    } catch (e) {
      setStep("exam");
      setError(e instanceof Error ? e.message : "提交失败");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        加载试卷中…
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-600">{error || "试卷不存在"}</p>
        <Link href="/" className="mt-4 inline-block text-blue-600">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-slate-500">{exam.title}</p>
            <p className="text-sm font-medium text-slate-800">
              {studentName || "未登录"} · {studentId || "——"}
            </p>
          </div>
          {step === "exam" && deadline ? (
            <div className="text-right">
              <p className="text-xs text-slate-500">剩余时间</p>
              <p className="font-mono text-lg font-semibold text-blue-700">
                {remaining}
              </p>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {step === "identity" ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-1 text-lg font-semibold">身份验证</h2>
            <p className="mb-5 text-sm text-slate-600">
              请填写姓名与 12 位学号后开始作答。
            </p>
            <StudentIdentityForm onSubmit={startExam} />
          </section>
        ) : null}

        {step === "exam" || step === "submitting" ? (
          <>
            <ExamPaper
              questions={exam.questions}
              answers={answers}
              disabled={step === "submitting"}
              onChange={(id, value) =>
                setAnswers((prev) => ({ ...prev, [id]: value }))
              }
            />
            {error ? (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            ) : null}
            <div className="mt-8 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                未作答 {unanswered} 题
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={step === "submitting"}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {step === "submitting" ? "提交中…" : "交卷"}
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

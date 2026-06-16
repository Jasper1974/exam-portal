"use client";

import type { ExamQuestion } from "@/lib/types";

type Props = {
  questions: ExamQuestion[];
  answers: Record<string, string | string[]>;
  onChange: (questionId: string, value: string | string[]) => void;
  disabled?: boolean;
};

export function ExamPaper({ questions, answers, onChange, disabled }: Props) {
  return (
    <div className="space-y-8">
      {questions.map((q, index) => (
        <section
          key={q.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">
              {index + 1}. {q.stem}
            </h3>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {q.maxScore} 分
            </span>
          </div>

          {q.type === "single" && q.options ? (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.key}
                    checked={answers[q.id] === opt.key}
                    disabled={disabled}
                    onChange={() => onChange(q.id, opt.key)}
                    className="mt-1"
                  />
                  <span>
                    <strong>{opt.key}.</strong> {opt.label}
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          {q.type === "multiple" && q.options ? (
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = Array.isArray(answers[q.id])
                  ? (answers[q.id] as string[])
                  : [];
                const checked = selected.includes(opt.key);

                return (
                  <label
                    key={opt.key}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(opt.key);
                        else next.delete(opt.key);
                        onChange(q.id, [...next].sort());
                      }}
                      className="mt-1"
                    />
                    <span>
                      <strong>{opt.key}.</strong> {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null}

          {q.type === "text" ? (
            <textarea
              value={typeof answers[q.id] === "string" ? answers[q.id] : ""}
              disabled={disabled}
              onChange={(e) => onChange(q.id, e.target.value)}
              rows={5}
              placeholder="请在此作答…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          ) : null}
        </section>
      ))}
    </div>
  );
}

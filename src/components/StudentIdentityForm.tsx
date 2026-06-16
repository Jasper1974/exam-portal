"use client";

import { useState } from "react";
import { formatStudentId } from "@/lib/validation";

type Props = {
  initialName?: string;
  initialStudentId?: string;
  onSubmit: (data: { studentName: string; studentId: string }) => void;
  disabled?: boolean;
};

export function StudentIdentityForm({
  initialName = "",
  initialStudentId = "",
  onSubmit,
  disabled,
}: Props) {
  const [studentName, setStudentName] = useState(initialName);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = studentName.trim();
    const trimmedId = formatStudentId(studentId);

    if (trimmedName.length < 2) {
      setError("请输入真实姓名（至少 2 个字符）");
      return;
    }
    if (!/^\d{12}$/.test(trimmedId)) {
      setError("学号须为 12 位数字");
      return;
    }

    setError("");
    onSubmit({ studentName: trimmedName, studentId: trimmedId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          姓名
        </label>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="请输入姓名"
          disabled={disabled}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          学号（12 位数字）
        </label>
        <input
          value={studentId}
          onChange={(e) => setStudentId(formatStudentId(e.target.value))}
          placeholder="例如 202401010001"
          inputMode="numeric"
          maxLength={12}
          disabled={disabled}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        确认身份并进入考试
      </button>
    </form>
  );
}

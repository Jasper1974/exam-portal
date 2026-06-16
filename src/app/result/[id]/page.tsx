import { Suspense } from "react";
import ResultClient from "./ResultClient";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          加载成绩中…
        </div>
      }
    >
      <ResultClient />
    </Suspense>
  );
}

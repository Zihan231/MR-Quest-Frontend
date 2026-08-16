"use client";

import { useState, useEffect } from "react";
import { api } from "@/libs/api";
import { Search, Loader2, Award, Clock, CheckCircle2, ChevronRight, BookOpen, X } from "lucide-react";

export function StudentResultsList() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/exam-groups", {
        params: {
          page,
          limit: 12,
          q: search || undefined,
        },
      })
      .then(async (res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const newMeta = Array.isArray(res.data) ? null : (res.data.meta || null);

        // Fetch submission status for each exam group in parallel
        const enrichedData = await Promise.all(
          data.map(async (eg: any) => {
            try {
              const subRes = await api.get(`/exam-groups/${eg.id}/my-submissions`).catch(() => ({ data: [] }));
              const submission = subRes.data && subRes.data.length > 0 ? subRes.data[0] : null;
              return {
                ...eg,
                submission,
                hasSubmitted: !!submission,
              };
            } catch {
              return { ...eg, submission: null, hasSubmitted: false };
            }
          })
        );

        // Only display results for exams the student participated in (submitted)
        const participatedExams = enrichedData.filter((eg: any) => eg.hasSubmitted);
        setResults(participatedExams);
        setMeta(newMeta);
      })
      .catch((err) => {
        console.error("Failed to load results:", err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  const resetFilters = () => {
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = search !== "";

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Results</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">View evaluations and AI analysis feedback for tasks you completed.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3 bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search completed tasks..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading your results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <Award size={40} className="text-slate-300 dark:text-zinc-700 animate-pulse" />
          <p className="text-sm text-slate-500 font-semibold">No task results found.</p>
          <p className="text-xs text-slate-400">Tasks you take will be listed here once submitted.</p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs font-bold text-blue-600 dark:text-blue-400 underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((eg) => {
            const isPending = eg.submission?.status !== "Evaluated";
            return (
              <div
                key={eg.id}
                onClick={() => {
                  window.location.href = `/results/${eg.id}`;
                }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                        {eg.examGroupId}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mt-1 line-clamp-2">
                        {eg.title}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${
                        isPending
                          ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                          : "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Clock size={10} /> Pending
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={10} /> Evaluated
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {eg.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800/80 pt-3 mt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} className="text-blue-500" />
                      {eg.questions?.length ?? 0} questions
                    </span>
                    <span>
                      {eg.submission?.submittedAt
                        ? new Date(eg.submission.submittedAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50/50 dark:bg-zinc-950/20 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 group-hover:bg-slate-100/50 dark:group-hover:bg-zinc-800/50 transition">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {!isPending ? (
                      <>
                        Score: <span className="text-blue-600 dark:text-blue-400">{eg.submission?.studentVisibleMarks ?? eg.submission?.marksObtained}</span> / {(eg.submission?.studentVisibleTotal ?? eg.submission?.answers?.filter((a: any) => a.question?.type !== 'Video').reduce((sum: number, a: any) => sum + (a.question?.marks || 0), 0)) || 0}
                      </>
                    ) : (
                      "Review answers"
                    )}
                  </span>
                  <button className="flex items-center gap-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Review <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

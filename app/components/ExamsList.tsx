"use client";

import { useState, useEffect } from "react";
import { api } from "@/libs/api";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/useUser";
import { BookOpen, Search, Loader2, X, Play } from "lucide-react";
import { ExamGroupCard } from "@/components/ExamGroupCard";
import { ExamGroupPlayer } from "@/components/ExamGroupPlayer";

export function ExamsList() {
  const [examGroups, setExamGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const [takingExam, setTakingExam] = useState<any>(null);
  const [takingLoading, setTakingLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/exam-groups", {
        params: {
          page,
          limit: 6,
          q: search || undefined,
        },
      })
      .then(async (res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const newMeta = Array.isArray(res.data) ? null : (res.data.meta || null);
        
        // Fetch submission status for each exam group in parallel
        const enrichedData = await Promise.all(data.map(async (eg: any) => {
          try {
            const subRes = await api.get(`/exam-groups/${eg.id}/my-submissions`).catch(() => ({ data: [] }));
            const submission = subRes.data && subRes.data.length > 0 ? subRes.data[0] : null;
            return {
              ...eg,
              hasSubmitted: !!submission,
              isPending: submission ? submission.status !== 'Evaluated' : false
            };
          } catch {
            return { ...eg, hasSubmitted: false, isPending: false };
          }
        }));

        setExamGroups(enrichedData);
        setMeta(newMeta);
      })
      .catch(() => setExamGroups([]))
      .finally(() => setLoading(false));
  }, [search, page]);

  const resetFilters = () => {
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = search !== "";

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Tasks</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Browse and take available tasks.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3 bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
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
          <p className="text-sm text-slate-500">Loading tasks...</p>
        </div>
      ) : (
        examGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <BookOpen size={40} className="text-slate-300 dark:text-zinc-700" />
            <p className="text-sm text-slate-500">No tasks found.</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs font-bold text-blue-600 dark:text-blue-400 underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examGroups.map((eg) => (
              <ExamGroupCard
                key={eg.id}
                examGroup={{ ...eg, totalQuestions: eg.questions?.length ?? 0 }}
                onTake={() => { window.location.href = eg.hasSubmitted ? `/results/${eg.id}` : `/exams/${eg.id}`; }}
                showActions
                userRole="user"
              />
            ))}
          </div>
        )
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-slate-500">Page {meta.currentPage} of {meta.totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              Previous
            </button>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/libs/api";
import { roleLabel } from "@/libs/roleLabel";
import SubmissionAnswersView from "@/components/SubmissionAnswersView";
import { toast } from "react-hot-toast";
import { BarChart3, X, Loader2, Eye } from "lucide-react";

export function PerformanceBadge({ level }: { level?: string | null }) {
  const map: Record<string, string> = {
    good: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    average: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    "below-average": "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    poor: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  };
  const label: Record<string, string> = {
    good: "Good",
    average: "Average",
    "below-average": "Below Avg",
    poor: "Poor",
  };
  if (!level) return <span className="text-xs text-slate-400">No data</span>;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${map[level] || "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>
      {label[level] || level}
    </span>
  );
}

type Props = {
  user: { userId: string; name?: string } | null;
  onClose: () => void;
};

export default function PerformanceModal({ user, onClose }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<any | null>(null);
  const [isSubmissionLoading, setIsSubmissionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }
    let active = true;
    setIsLoading(true);
    setData(null);
    setViewingSubmission(null);
    (async () => {
      try {
        const res = await api.get(`/auth/users/${user.userId}/performance`);
        if (active) setData(res.data);
      } catch (err: any) {
        if (active) toast.error(err.response?.data?.message || "Failed to load performance data.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.userId]);

  const loadSubmissionForView = useCallback(async (examGroupId: number, submissionId: number) => {
    setIsSubmissionLoading(true);
    try {
      const res = await api.get(`/exam-groups/${examGroupId}/submissions/${submissionId}`);
      setViewingSubmission(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load submission answers.");
    } finally {
      setIsSubmissionLoading(false);
    }
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" /> Performance Analytics
            </h3>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
              <X size={18} />
            </button>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center gap-2 py-12 text-slate-400 text-sm">
              <Loader2 size={18} className="animate-spin" /> Analyzing performance records...
            </div>
          )}

          {!isLoading && data && (
            <>
              <div className="flex flex-col items-center gap-2 pb-5 border-b border-slate-100 dark:border-zinc-800 mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400 overflow-hidden">
                  {data.profile.profilePictureUrl ? (
                    <img src={data.profile.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    data.profile.name.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="font-bold text-slate-900 dark:text-zinc-50">{data.profile.name}</p>
                <p className="font-mono text-xs text-slate-500 dark:text-zinc-400 font-bold">{data.profile.userId}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{data.profile.email}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400">{roleLabel(data.profile.role)}</span>
                  <PerformanceBadge level={data.overall?.performanceLevel} />
                </div>
                <div className="mt-1 grid w-full grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Phone", value: data.profile.phoneNumber },
                    { label: "Address", value: data.profile.address },
                    { label: "Region", value: [data.profile.division, data.profile.district, data.profile.upazila].filter(Boolean).join(", ") || null },
                    { label: "Joined", value: data.profile.createdAt ? new Date(data.profile.createdAt).toLocaleDateString() : null },
                  ].filter((item) => item.value).map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-zinc-900/60">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{item.label}</p>
                      <p className="mt-0.5 font-medium text-slate-700 break-words dark:text-zinc-200">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-5">
                <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tasks Taken</p>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-zinc-50">{data.overall?.totalExams || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Marks</p>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-zinc-50">{data.overall?.totalMarks || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Avg Score</p>
                  <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">{data.overall?.avgScore ? `${data.overall.avgScore}%` : "—"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Best Score</p>
                  <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{data.overall?.bestScore ? `${data.overall.bestScore}%` : "—"}</p>
                </div>
              </div>

              {(data.examHistory || []).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-3">Task History</h4>
                  <div className="flex flex-col gap-2">
                    {(data.examHistory as any[]).slice().reverse().map((rec) => (
                      <button
                        key={rec.submissionId}
                        type="button"
                        onClick={() => {
                          setViewingSubmission(null);
                          if (rec.examGroupId && rec.submissionId) {
                            loadSubmissionForView(rec.examGroupId, rec.submissionId);
                          } else {
                            toast.error("Unable to open submission answers for this record.");
                          }
                        }}
                        title="View question & answers"
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 text-sm text-left transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-zinc-800 dark:hover:border-blue-900/40 dark:hover:bg-blue-900/10"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate dark:text-zinc-200">{rec.examTitle}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(rec.submittedAt).toLocaleDateString()} · Rank #{rec.rank} of {rec.totalParticipants} · {rec.marksObtained}/{rec.totalMarks} marks
                          </p>
                        </div>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-sm font-bold ${rec.scorePercent >= 60 ? "text-green-600 dark:text-green-400" : rec.scorePercent >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                            {rec.scorePercent}%
                          </span>
                          <Eye size={14} className="text-slate-400" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {data.weaknessAnalysis && (
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-3">Weakness Analysis</h4>
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm dark:bg-zinc-900/60">
                    <span className="text-slate-500 dark:text-zinc-400">Overall mastery</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-50">{data.weaknessAnalysis.overallPercent}%</span>
                  </div>
                  {(data.weaknessAnalysis.breakdown || []).map((b: any) => (
                    <div key={b.type} className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-600 dark:text-zinc-300">{b.type}</span>
                        <span className="text-slate-400">{b.awardedMarks}/{b.maxMarks} marks · {b.percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${b.percent >= 60 ? "bg-green-500" : b.percent >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(100, b.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {data.weaknessAnalysis.video?.accuracy && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-2">Video Interview Breakdown</p>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm dark:bg-zinc-900/60">
                        <span className="font-semibold text-slate-600 dark:text-zinc-300">Script Accuracy</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-100">
                          {data.weaknessAnalysis.video.accuracy.percent}%
                          <span className="text-xs font-normal text-slate-400"> ({data.weaknessAnalysis.video.accuracy.awarded}/{data.weaknessAnalysis.video.accuracy.max} marks)</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(!data.examHistory || data.examHistory.length === 0) && (
                <p className="py-8 text-center text-sm text-slate-400">No task submissions recorded for this user yet.</p>
              )}
            </>
          )}

          {!isLoading && !data && (
            <p className="py-8 text-center text-sm text-slate-400">Unable to load performance data.</p>
          )}
        </div>
      </div>

      {/* Submission Answers Modal (read-only, opened from Task History) */}
      {isSubmissionLoading && !viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212]">
            <div className="flex justify-center items-center gap-2 py-12 text-slate-400 text-sm">
              <Loader2 size={18} className="animate-spin" /> Loading submission answers...
            </div>
          </div>
        </div>
      )}

      {viewingSubmission && (
        <SubmissionAnswersView
          submission={viewingSubmission}
          onClose={() => setViewingSubmission(null)}
        />
      )}
    </>
  );
}

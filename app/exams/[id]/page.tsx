"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/libs/api";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, Play, Loader2, CheckCircle, Video } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import ManageExamGroupPage from "./ManageExamGroupPage";
import { ExamGroupPlayer } from "@/components/ExamGroupPlayer";

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examGroupId = Number(params.id);

  const { role } = useUser();
  const [examGroup, setExamGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    if (!examGroupId) return;
    setLoading(true);

    Promise.all([
      api.get(`/exam-groups/${examGroupId}`),
      api.get(`/exam-groups/${examGroupId}/my-submissions`).catch(() => ({ data: [] }))
    ])
      .then(([egRes, subRes]) => {
        setExamGroup(egRes.data);
        if (subRes.data && subRes.data.length > 0) {
          router.replace(`/results/${examGroupId}`);
        }
      })
      .catch(() => {
        toast.error("Failed to load task.");
        router.push("/exams");
      })
      .finally(() => setLoading(false));
  }, [examGroupId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading task...</p>
      </div>
    );
  }

  if (role === 'admin' || role === 'employee') {
    return <ManageExamGroupPage />;
  }

  if (!examGroup) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-red-500 font-semibold">Task not found.</p>
        <button
          onClick={() => router.push("/exams")}
          className="text-sm text-blue-600 underline font-bold"
        >
          Go back
        </button>
      </div>
    );
  }

  const isActive = examGroup.status === "active";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <button
          onClick={() => router.push("/exams")}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 mb-2 self-start"
        >
          <ArrowLeft size={14} /> Back to Tasks
        </button>

        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                {examGroup.examGroupId}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 mt-1 tracking-tight">{examGroup.title}</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                {examGroup.description || "No description provided."}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${isActive ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30" : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"}`}>
              {examGroup.status}
            </span>
          </div>

          <div className="w-full">
            <div className="w-full mt-4">
              <ExamGroupPlayer
                examGroupId={examGroupId}
                examGroup={examGroup}
                userId=""
                onComplete={() => {
                  router.push(`/results/${examGroupId}`);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

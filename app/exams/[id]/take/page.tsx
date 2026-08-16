"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/libs/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { ExamGroupPlayer } from "@/components/ExamGroupPlayer";

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examGroupId = Number(params.id);

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
        const eg = egRes.data;
        if (subRes.data && subRes.data.length > 0) {
          eg.submissions = subRes.data;
        }
        setExamGroup(eg);
      }).catch((err) => {
        toast.error(err.response?.data?.message || "Failed to start task.");
        router.push(`/exams/${examGroupId}`);
      }).finally(() => setLoading(false));
  }, [examGroupId, router]);

  const handleComplete = () => {
    window.location.href = `/exams/${examGroupId}`;
  };

  const handleCancel = () => {
    router.push(`/exams/${examGroupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Starting task...</p>
      </div>
    );
  }

  if (!examGroup) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">Task not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ExamGroupPlayer
          examGroupId={examGroupId}
          examGroup={examGroup}
          userId=""
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

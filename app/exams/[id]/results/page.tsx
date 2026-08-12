"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/libs/api";
import { ArrowLeft, CheckCircle, Video, Loader2, Clock, AlertCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { ReferenceDocViewer } from "@/components/ReferenceDocViewer";

const getAbsoluteDocUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examGroupId = Number(params.id);

  const { role } = useUser();
  const [examGroup, setExamGroup] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          setSubmission(subRes.data[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load results:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [examGroupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading results...</p>
      </div>
    );
  }

  if (!examGroup || !submission) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-red-500 font-semibold">No submission found for this exam.</p>
        <button
          onClick={() => router.push("/exams")}
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Exams
        </button>
      </div>
    );
  }

  const isPending = submission.status !== 'Evaluated';
  const hasAIQuestion = (examGroup.questions || []).some((q: any) => q.evaluationType === 'AI');

  // Student visible marks = sum of MCQ + CQ marks only (excludes Video)
  const studentVisibleMarks = submission.studentVisibleMarks ?? 
    (submission.answers || []).filter((ans: any) => ans.question?.type !== 'Video')
      .reduce((sum: number, ans: any) => sum + (ans.marksAwarded || 0), 0);
  const studentVisibleTotal = submission.studentVisibleTotal ??
    (submission.answers || []).filter((ans: any) => ans.question?.type !== 'Video')
      .reduce((sum: number, ans: any) => sum + (ans.question?.marks || 0), 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <button
          onClick={() => router.push("/exams")}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 mb-2 self-start"
        >
          <ArrowLeft size={14} /> Back to Exams
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${isPending ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'}`}>
              {isPending ? 'Pending Evaluation' : 'Evaluated'}
            </span>
          </div>

          <div className="w-full">
            <div className="w-full flex flex-col gap-6 mt-2 animate-fadeIn">
              {/* Marks Obtained Card */}
              <div className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-3">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Exam Results</h3>
                  <p className="text-xs text-slate-500 mb-1">{isPending ? "Your submission is undergoing evaluation." : "Your exam has been fully evaluated."}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col items-center gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Marks Obtained</span>
                  {isPending ? (
                    <span className="text-xl font-bold text-amber-500 animate-pulse py-1">Pending Evaluation</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{studentVisibleMarks ?? 0}</span>
                      {studentVisibleTotal > 0 && (
                        <span className="text-xs text-slate-400">out of {studentVisibleTotal} marks</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Header Status Card */}
              {isPending && (
                <div className="w-full bg-amber-50/60 border border-amber-200 dark:bg-amber-950/25 dark:border-amber-900/35 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center">
                  {hasAIQuestion ? (
                    <>
                      <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">AI Evaluation In Progress</h3>
                      <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md">
                        Your answers are currently being analyzed by the AI grading agent. Please wait <strong>2-3 minutes</strong> and refresh the page to view your final scores.
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-10 w-10 text-amber-500" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Pending Evaluation</h3>
                      <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md">
                        Your answers have been submitted successfully and are pending manual evaluation by an evaluator.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Answers Review Block (Not Editable) */}
              {submission.answers && submission.answers.length > 0 && (
                <div className="w-full flex flex-col gap-4">
                  <h4 className="font-bold text-slate-900 dark:text-zinc-50 mb-2">
                    {isPending ? "Review Submitted Answers (Read-Only)" : "Review Your Answers"}
                  </h4>
                  {submission.answers.map((ans: any, idx: number) => {
                    const q = ans.question;
                    if (!q) return null;
                    return (
                      <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-3">
                              <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">{q.questionText}</p>
                              {!isPending && q.type !== 'Video' && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-md shrink-0">
                                  {ans.marksAwarded} / {q.marks} marks
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              {q.type === 'MCQ' ? (
                                (q.options || []).map((opt: string, optIdx: number) => {
                                  const optionKey = `option_${optIdx}`;
                                  const isSelected = (ans.providedAnswer || []).includes(optionKey);
                                  const isCorrect = (q.correctAnswers || []).includes(optionKey);

                                  let btnClass = "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300";
                                  if (!isPending) {
                                    if (isSelected && isCorrect) {
                                      btnClass = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400";
                                    } else if (isSelected && !isCorrect) {
                                      btnClass = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
                                    } else if (!isSelected && isCorrect) {
                                      btnClass = "border-green-500 bg-green-50/50 dark:bg-green-950/10 text-green-700 dark:text-green-400 border-dashed";
                                    }
                                  } else {
                                    if (isSelected) {
                                      btnClass = "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400";
                                    }
                                  }

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`text-left text-sm px-5 py-4 rounded-xl border flex items-center gap-2 ${btnClass}`}
                                    >
                                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? (!isPending ? (isCorrect ? "border-green-500 bg-green-600" : "border-red-500 bg-red-600") : "border-blue-500 bg-blue-600") : "border-slate-300 dark:border-zinc-700"}`}>
                                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </span>
                                      {opt}
                                      {!isPending && isSelected && isCorrect && <CheckCircle size={14} className="ml-auto text-green-600" />}
                                    </div>
                                  );
                                })
                              ) : q.type === 'Video' ? (
                                <div className="flex flex-col gap-3 mt-1">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div className="bg-black/5 dark:bg-black/20 rounded-xl p-4 mt-2">
                                      {ans.providedAnswer && ans.providedAnswer[0] ? (
                                        <video controls className="w-full max-h-[300px] rounded-lg">
                                          <source src={getAbsoluteDocUrl(ans.providedAnswer[0])} />
                                          Your browser does not support the video tag.
                                        </video>
                                      ) : (
                                        <p className="text-sm text-slate-500 italic">No video submitted.</p>
                                      )}
                                    </div>
                                    {q.referenceScript && (
                                      <div className="mt-2">
                                        <ReferenceDocViewer referenceScript={q.referenceScript} />
                                      </div>
                                    )}
                                  </div>
                                  {!isPending && ans.evaluatorComment && (
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 mt-2">
                                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                                        AI Feedback & Analysis
                                      </span>
                                      {(() => {
                                        try {
                                          const parsed = JSON.parse(ans.evaluatorComment);
                                          if (parsed.studentFeedback) {
                                            const sf = parsed.studentFeedback;
                                            return (
                                              <div className="flex flex-col gap-3 text-xs mt-2">
                                                {sf.encouragement && (
                                                  <div>
                                                    <p className="font-bold text-green-600 dark:text-green-400">You're doing well:</p>
                                                    <p className="text-slate-700 dark:text-zinc-300 font-medium mt-0.5">{sf.encouragement}</p>
                                                  </div>
                                                )}
                                                {sf.mistakesIdentified && (
                                                  <div>
                                                    <p className="font-bold text-slate-800 dark:text-zinc-200">Areas to focus on:</p>
                                                    <p className="text-slate-600 dark:text-zinc-400 font-medium mt-0.5">{sf.mistakesIdentified}</p>
                                                  </div>
                                                )}
                                                {sf.improvementSuggestions && (
                                                  <div>
                                                    <p className="font-bold text-blue-600 dark:text-blue-400">How to improve:</p>
                                                    <p className="text-slate-600 dark:text-zinc-400 font-medium mt-0.5">{sf.improvementSuggestions}</p>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }
                                          return <p className="text-sm text-slate-700 dark:text-zinc-300 mt-1">{parsed.feedback || ans.evaluatorComment}</p>;
                                        } catch {
                                          return <p className="text-sm text-slate-700 dark:text-zinc-300 mt-1">{ans.evaluatorComment}</p>;
                                        }
                                      })()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3 mt-1">
                                  <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-slate-200 dark:border-zinc-800">
                                    <p className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                                      {ans.providedAnswer && ans.providedAnswer[0] ? ans.providedAnswer[0] : <span className="italic text-slate-400">No answer provided.</span>}
                                    </p>
                                  </div>
                                  {!isPending && ans.evaluatorComment && (
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 mt-2">
                                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                                        {ans.evaluatedBy === 'AI' ? 'AI Feedback & Analysis' : 'Evaluator Feedback'}
                                      </span>
                                      {(() => {
                                        try {
                                          const parsed = JSON.parse(ans.evaluatorComment);
                                          return <p className="text-sm text-slate-700 dark:text-zinc-300 mt-1">{parsed.feedback}</p>;
                                        } catch {
                                          return <p className="text-sm text-slate-700 dark:text-zinc-300 mt-1">{ans.evaluatorComment}</p>;
                                        }
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
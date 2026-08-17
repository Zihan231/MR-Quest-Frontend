"use client";

import React, { useState } from "react";
import { api } from "@/libs/api";
import { CheckCircle2, ArrowLeft, Loader2, X, Mail, User as UserIcon, Phone, MapPin, Award, Calendar, Shield } from "lucide-react";
import { toast } from "react-hot-toast";
import { ReferenceDocViewer } from "@/components/ReferenceDocViewer";
import { sortByType, getTypeAccentClass, getTypeChipClass } from "@/libs/questionSort";
import { roleLabel } from "@/libs/roleLabel";

type Props = {
  submission: any;
  examGroupId: number;
  onClose: () => void;
  onEvaluated: () => void;
};
  
const getAbsoluteDocUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ExamGroupEvaluationView({ submission, examGroupId, onClose, onEvaluated }: Props) {
  const [evaluations, setEvaluations] = useState<Record<number, { marksAwarded: number | string; evaluatorComment: string }>>({});
  const [initialEvaluations, setInitialEvaluations] = useState<Record<number, { marksAwarded: number | string; evaluatorComment: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Initialize evaluations state, pre-filling previous marks/feedback
  React.useEffect(() => {
    if (submission?.answers) {
      const initialEvals: any = {};
      submission.answers.forEach((ans: any) => {
        const isMCQAns = ans.question?.type === 'MCQ';
        const isAIAns = ans.question?.evaluationType === 'AI';
        if (isMCQAns || isAIAns) return;
        initialEvals[ans.id] = {
          marksAwarded: ans.marksAwarded ? String(ans.marksAwarded) : "",
          evaluatorComment: ans.evaluatorComment || "",
        };
      });
      setInitialEvaluations(initialEvals);
      setEvaluations(initialEvals);
    }
  }, [submission]);

  const isDirty = JSON.stringify(evaluations) !== JSON.stringify(initialEvaluations);

  const handleMarksChange = (answerId: number, raw: string, maxMarks: number) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const numeric = parseFloat(cleaned);
    let next = cleaned;
    if (!isNaN(numeric)) {
      next = String(Math.min(Math.max(0, numeric), maxMarks));
    }
    setEvaluations(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        marksAwarded: next
      }
    }));
  };

  const handleCommentChange = (answerId: number, comment: string) => {
    setEvaluations(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        evaluatorComment: comment
      }
    }));
  };

  const openProfile = async () => {
    setViewingProfile(true);
    setLoadingProfile(true);
    setProfileData(null);
    try {
      const res = await api.get(`/auth/profile/${submission.user?.userId}`);
      setProfileData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load user profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const submitEvaluation = async () => {
    const manualAnswers = (submission.answers || []).filter(
      (ans: any) => ans.question?.type !== 'MCQ' && !(ans.question?.evaluationType === 'AI')
    );

    for (const ans of manualAnswers) {
      const val = evaluations[ans.id]?.marksAwarded;
      if (val === undefined || val === null || val === "") {
        toast.error(`Please input marks for question: "${ans.question?.questionText || 'Manual Evaluation'}"`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        submissionId: submission.id,
        evaluations: Object.keys(evaluations).map(ansId => ({
          answerId: Number(ansId),
          marksAwarded: String(evaluations[Number(ansId)].marksAwarded),
          evaluatorComment: evaluations[Number(ansId)].evaluatorComment,
        }))
      };

      await api.put(`/exam-groups/${examGroupId}/evaluations`, payload);
      toast.success("Evaluation saved successfully!");
      onEvaluated();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAiFeedback = (ans: any, q: any, parsed: any) => {
    if (parsed && parsed.adminFeedback) {
      const admin = parsed.adminFeedback;
      const breakdown = admin.breakdown || {};
      return (
        <div className="flex flex-col gap-3 text-xs mt-2">
          <div className="grid grid-cols-1 gap-2 text-center">
            <div className="bg-white/80 dark:bg-zinc-900 p-2 rounded-lg border border-slate-200/50 dark:border-zinc-800">
              <p className="font-bold text-slate-500 uppercase text-[9px]">Script Accuracy</p>
              <p className="font-extrabold text-slate-800 dark:text-zinc-200 mt-0.5">{parsed.accuracyScore} / {q.accuracyMarks ?? q.marks}</p>
            </div>
          </div>
          <div className="mt-1 flex flex-col gap-2.5">
            {admin.scoreAnalysis && (
              <div>
                <p className="font-bold text-slate-800 dark:text-zinc-200">Score Analysis:</p>
                <p className="text-slate-600 dark:text-zinc-400 font-medium">{admin.scoreAnalysis}</p>
              </div>
            )}
            {breakdown.topicsCovered?.length > 0 && (
              <div>
                <p className="font-bold text-green-600 dark:text-green-400">Topics Covered:</p>
                <ul className="list-disc ml-4 text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                  {breakdown.topicsCovered.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            {breakdown.topicsMissed?.length > 0 && (
              <div>
                <p className="font-bold text-red-600 dark:text-red-400">Topics Missed:</p>
                <ul className="list-disc ml-4 text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                  {breakdown.topicsMissed.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            {breakdown.medicalTermsCorrect?.length > 0 && (
              <div>
                <p className="font-bold text-green-600 dark:text-green-400">Medical Terms (Correct):</p>
                <ul className="list-disc ml-4 text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                  {breakdown.medicalTermsCorrect.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            {breakdown.medicalTermsIncorrect?.length > 0 && (
              <div>
                <p className="font-bold text-red-600 dark:text-red-400">Medical Terms (Incorrect):</p>
                <ul className="list-disc ml-4 text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                  {breakdown.medicalTermsIncorrect.map((t: any, i: number) => (
                    <li key={i}>"{t.studentSaid}" → should be "{t.correctTerm}"</li>
                  ))}
                </ul>
              </div>
            )}
            {breakdown.inaccurateStatements?.length > 0 && (
              <div>
                <p className="font-bold text-red-600 dark:text-red-400">Inaccurate Statements:</p>
                <ul className="list-disc ml-4 text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                  {breakdown.inaccurateStatements.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            {breakdown.keyMessagesCovered?.length > 0 && (
              <div>
                <p className="font-bold text-green-600 dark:text-green-400">Key Messages Covered:</p>
                <ul className="list-disc ml-4 text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                  {breakdown.keyMessagesCovered.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            {breakdown.keyMessagesMissed?.length > 0 && (
              <div>
                <p className="font-bold text-red-600 dark:text-red-400">Key Messages Missed:</p>
                <ul className="list-disc ml-4 text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                  {breakdown.keyMessagesMissed.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            {admin.improvementSuggestions && (
              <div>
                <p className="font-bold text-blue-600 dark:text-blue-400">Improvement Suggestions:</p>
                <p className="text-slate-600 dark:text-zinc-400 font-medium">{admin.improvementSuggestions}</p>
              </div>
            )}
            {admin.additionalFeedback && (
              <div>
                <p className="font-bold text-slate-800 dark:text-zinc-200">Additional Feedback:</p>
                <p className="text-slate-600 dark:text-zinc-400 font-medium">{admin.additionalFeedback}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return <p className="text-sm text-slate-700 dark:text-zinc-300 mt-2">{parsed?.feedback || ans.evaluatorComment || 'No feedback provided.'}</p>;
  };

  if (!submission) return null;

  const sortedAnswers = sortByType(submission?.answers || [], (a: any) => a.question?.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212] flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 transition mb-2 w-fit border border-blue-100 dark:border-blue-900/30">
              <ArrowLeft size={14} className="stroke-[3px]" /> Back to Submissions
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
              Evaluating: {submission.user?.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Score: <span className="font-bold text-blue-600">{submission.marksObtained}</span> points | Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={openProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition border border-slate-200 dark:border-zinc-700 shrink-0"
          >
            <UserIcon size={14} /> View Profile
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
          {sortedAnswers.length > 0 ? (
            sortedAnswers.map((ans: any, idx: number) => {
              const q = ans.question;
              if (!q) return null;

              const isMCQ = q.type === 'MCQ';
              const isAIQuestion = q.evaluationType === 'AI';
              const hasAiFeedback = isAIQuestion && !!ans.evaluatorComment;
              const isAIReviewed = hasAiFeedback;

              // Try parsing AI comment if it exists
              let aiCommentParsed = null;
              if (hasAiFeedback && ans.evaluatorComment) {
                try {
                  aiCommentParsed = JSON.parse(ans.evaluatorComment);
                } catch (e) {
                  // Ignore
                }
              }
              const aiMarks =
                ans.marksAwarded > 0
                  ? ans.marksAwarded
                  : aiCommentParsed?.overallScore ?? ans.marksAwarded;

              return (
                <div key={idx} className={`border-l-4 ${getTypeAccentClass(q.type)} bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm`}>
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{q.questionText}</p>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${getTypeChipClass(q.type)}`}>{q.type}</span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-md shrink-0">
                            {q.marks} Marks
                          </span>
                        </div>
                      </div>

                      {/* Answer Display */}
                      <div className="mt-4">
                        {isMCQ ? (
                          <div className="flex flex-col gap-2">
                            {(q.options || []).map((opt: string, optIdx: number) => {
                              const optionKey = `option_${optIdx}`;
                              const isSelected = (ans.providedAnswer || []).includes(optionKey);
                              const isCorrect = (q.correctAnswers || []).includes(optionKey);
                              
                              let btnClass = "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300";
                              if (isSelected && isCorrect) {
                                btnClass = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400";
                              } else if (isSelected && !isCorrect) {
                                btnClass = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
                              } else if (!isSelected && isCorrect) {
                                btnClass = "border-green-500 bg-green-50/50 dark:bg-green-950/10 text-green-700 dark:text-green-400 border-dashed";
                              }

                              return (
                                <div key={optIdx} className={`text-left text-xs px-4 py-3 rounded-xl border flex items-center gap-2 ${btnClass}`}>
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? (isCorrect ? "border-green-500 bg-green-600" : "border-red-500 bg-red-600") : "border-slate-300 dark:border-zinc-700"}`}>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </span>
                                  {opt}
                                  {isSelected && isCorrect && <CheckCircle2 size={14} className="ml-auto text-green-600" />}
                                </div>
                              );
                            })}
                          </div>
                        ) : q.type === 'Video' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="bg-black/5 dark:bg-black/20 rounded-xl p-4">
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
                              <ReferenceDocViewer referenceScript={q.referenceScript} />
                            )}
                          </div>
                        ) : (
                          <>
                            {q.referenceScript && (
                              <div className="mb-3">
                                <ReferenceDocViewer referenceScript={q.referenceScript} />
                              </div>
                            )}
                            <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-slate-200 dark:border-zinc-800">
                              <p className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                                {ans.providedAnswer && ans.providedAnswer[0] ? ans.providedAnswer[0] : <span className="italic text-slate-400">No answer provided.</span>}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Evaluation Controls */}
                      {!isMCQ && (
                        <div className="mt-6 border-t border-slate-200 dark:border-zinc-800 pt-4">
                          {isAIQuestion ? (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                  {isAIReviewed ? 'AI Reviewed' : 'AI Evaluation'}
                                </span>
                                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                                  {isAIReviewed ? `Marks Awarded: ${aiMarks} / ${q.marks}` : 'Pending AI Review'}
                                </span>
                              </div>
                              {isAIReviewed ? (
                                renderAiFeedback(ans, q, aiCommentParsed)
                              ) : (
                                <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 flex items-center gap-2">
                                  <Loader2 size={14} className="animate-spin text-blue-500" />
                                  AI evaluation in progress. This question will be graded automatically.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Manual Evaluation</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500">Marks out of {q.marks}:</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={evaluations[ans.id]?.marksAwarded ?? ''}
                                    onChange={(e) => handleMarksChange(ans.id, e.target.value, q.marks)}
                                    className="w-20 rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-sm font-bold focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 text-center"
                                  />
                                </div>
                              </div>
                              <textarea
                                placeholder="Add constructive feedback..."
                                rows={3}
                                value={evaluations[ans.id]?.evaluatorComment || ''}
                                onChange={(e) => handleCommentChange(ans.id, e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No answers found for this submission.</p>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={submitEvaluation}
            disabled={isSubmitting || !isDirty}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-bold transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Save Evaluation
          </button>
        </div>
      </div>

      {/* View Profile Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewingProfile(false)}>
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                <UserIcon size={16} className="text-blue-600" /> User Profile
              </h3>
              <button
                onClick={() => setViewingProfile(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-1.5 rounded-full transition"
              >
                <X size={15} />
              </button>
            </div>

            {loadingProfile ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={28} className="animate-spin text-blue-600" />
                <p className="text-xs text-slate-500">Loading profile...</p>
              </div>
            ) : profileData ? (
              <div className="flex flex-col gap-5">
                {/* Avatar + Name */}
                <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-3xl font-bold text-white ring-2 ring-blue-100 dark:ring-blue-900">
                    {profileData.profilePictureUrl ? (
                      <img src={getAbsoluteDocUrl(profileData.profilePictureUrl)} alt={profileData.name} className="h-full w-full object-cover" />
                    ) : (
                      (profileData.name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">{profileData.name}</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-xs font-mono text-slate-400">{profileData.userId}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        profileData.role === 'admin'
                          ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30'
                          : profileData.role === 'employee'
                          ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                          : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                      }`}>
                        <Shield size={9} /> {roleLabel(profileData.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                    <Mail size={15} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate">{profileData.email || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                    <Phone size={15} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{profileData.phoneNumber || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                    <MapPin size={15} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Address</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{profileData.address || "—"}</p>
                    </div>
                  </div>

                  {profileData.division || profileData.district || profileData.upazila ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                      <Award size={15} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Region</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {[profileData.division, profileData.district, profileData.upazila].filter(Boolean).join(" / ") || "—"}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {profileData.createdAt && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                      <Calendar size={15} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Member Since</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{new Date(profileData.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end border-t border-slate-100 dark:border-zinc-800 pt-4">
                  <button
                    onClick={() => setViewingProfile(false)}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Failed to load profile.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

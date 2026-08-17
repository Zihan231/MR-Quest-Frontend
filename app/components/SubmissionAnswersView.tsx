"use client";

import React from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { sortByType, getTypeAccentClass, getTypeChipClass } from "@/libs/questionSort";

type Props = {
  submission: any;
  onClose: () => void;
};

export default function SubmissionAnswersView({ submission, onClose }: Props) {
  const renderAiFeedback = (ans: any, q: any, parsed: any) => {
    if (parsed && parsed.adminFeedback) {
      const admin = parsed.adminFeedback;
      const breakdown = admin.breakdown || {};
      return (
        <div className="flex flex-col gap-3 text-xs mt-2">
          <div className="grid grid-cols-1 gap-2 text-center">
            <div className="bg-white/80 dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200/50 dark:border-zinc-800">
              <p className="font-bold text-slate-500 uppercase text-[9px]">Script Accuracy Score</p>
              <p className="font-extrabold text-slate-800 dark:text-zinc-200 mt-0.5">{parsed.accuracyScore} / {q.accuracyMarks ?? q.marks}</p>
            </div>
          </div>
          <div className="mt-1 flex flex-col gap-2.5 text-left">
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
                    <li key={i}>"{t.studentSaid}" &rarr; should be "{t.correctTerm}"</li>
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
    return (
      <div className="mt-3 text-sm text-slate-700 dark:text-zinc-300">
        <p className="font-semibold mb-1">Feedback:</p>
        <p>{parsed?.feedback || ans.evaluatorComment || 'No feedback provided.'}</p>
      </div>
    );
  };

  const sortedAnswers = sortByType(submission?.answers || [], (a: any) => a.question?.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 transition mb-2 w-fit border border-blue-100 dark:border-blue-900/30">
              <ArrowLeft size={14} className="stroke-[3px]" /> Back
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
              Viewing: {submission.user?.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Score: <span className="font-bold text-blue-600">{submission.marksObtained}</span> points | Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
          {sortedAnswers.length > 0 ? (
            sortedAnswers.map((ans: any, idx: number) => {
              const q = ans.question;
              if (!q) return null;

              const isMCQ = q.type === 'MCQ';
              const isAIFailed = (ans.evaluatorComment || '').startsWith('__AI_FAILED__');
              const isAIReviewed = q.evaluationType === 'AI' && ans.evaluatedBy === 'AI' && !isAIFailed;

              let aiCommentParsed = null;
              if (isAIReviewed && ans.evaluatorComment) {
                try {
                  aiCommentParsed = JSON.parse(ans.evaluatorComment);
                } catch (e) {
                  // Ignore
                }
              }

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
                          <div className="bg-black/5 dark:bg-black/20 rounded-xl p-4">
                            {ans.providedAnswer && ans.providedAnswer[0] ? (
                              <video controls className="w-full max-h-[300px] rounded-lg">
                                <source src={ans.providedAnswer[0]} />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <p className="text-sm text-slate-500 italic">No video submitted.</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-slate-200 dark:border-zinc-800">
                            <p className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                              {ans.providedAnswer && ans.providedAnswer[0] ? ans.providedAnswer[0] : <span className="italic text-slate-400">No answer provided.</span>}
                            </p>
                          </div>
                        )}
                      </div>

                      {!isMCQ && (
                        <div className="mt-6 border-t border-slate-200 dark:border-zinc-800 pt-4">
                          {isAIReviewed ? (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                  AI Reviewed
                                </span>
                                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                                  Marks Awarded: {ans.marksAwarded} / {q.marks}
                                </span>
                              </div>
                              {renderAiFeedback(ans, q, aiCommentParsed)}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {isAIFailed && (
                                <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                                  <span className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">⚠</span>
                                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    AI evaluation failed for this answer.
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">Manual Evaluation</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                                  Marks Awarded: {ans.marksAwarded ?? 0} / {q.marks}
                                </span>
                              </div>
                              {ans.evaluatorComment ? (
                                <p className="rounded-xl bg-white dark:bg-zinc-950 p-3 border border-slate-200 dark:border-zinc-800 text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                                  {ans.evaluatorComment}
                                </p>
                              ) : (
                                <p className="text-xs font-semibold text-slate-400">
                                  This answer is pending manual evaluation.
                                </p>
                              )}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
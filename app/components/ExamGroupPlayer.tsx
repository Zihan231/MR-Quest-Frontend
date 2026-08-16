"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/libs/api";
import toast from "react-hot-toast";
import { CheckCircle, Loader2, AlertTriangle, Video, UploadCloud, X, Maximize2, Minimize2, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { WebcamRecorder } from "./WebcamRecorder";
import { ReferenceDocViewer } from "./ReferenceDocViewer";

const getAbsoluteDocUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

function DocxPreview({ url }: { url: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    console.log("Fetching docx from URL:", url);
    fetch(url)
      .then((res) => {
        console.log("Fetch response status:", res.status, res.ok);
        if (!res.ok) throw new Error("Failed to fetch document");
        return res.blob();
      })
      .then((blob) => {
        console.log("Fetched blob size:", blob.size);
        if (!active || !containerRef.current) return;
        console.log("Importing docx-preview...");
        return import("docx-preview").then((docx) => {
          console.log("Loaded docx-preview module:", docx);
          const renderFn = docx.renderAsync || (docx as any).default?.renderAsync;
          if (!renderFn) {
            throw new Error("renderAsync function not found in docx-preview");
          }
          console.log("Rendering docx...");
          containerRef.current!.innerHTML = "";
          return renderFn(blob, containerRef.current!, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
          }).then(() => {
            console.log("Render complete!");
          });
        });
      })
      .then(() => {
        if (active) {
          console.log("Setting loading to false");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Docx render error:", err);
        if (active) {
          setError(err.message || "Failed to load/render Word document");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div className="p-4 overflow-auto h-full w-full bg-slate-100 dark:bg-zinc-900 min-h-[350px]">
      <style dangerouslySetInnerHTML={{__html: `
        .docx-container-white {
          background-color: #f1f5f9 !important;
          color: #000000 !important;
          border-radius: 8px !important;
          width: 100% !important;
        }
        .docx-container-white * {
          color: #000000 !important;
          border-color: #e2e8f0 !important;
        }
        .docx-wrapper {
          background: #f1f5f9 !important;
          padding: 24px 16px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
        }
        .docx {
          background: white !important;
          color: black !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          padding: 32px 24px !important;
          margin-bottom: 24px !important;
          display: block !important;
        }
      `}} />

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 bg-slate-100 dark:bg-zinc-900 rounded-lg">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-500" size={32} />
          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Parsing reference document...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm text-red-500 font-semibold">{error}</p>
          <a href={url} download className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition mt-2">
            Download File Directly
          </a>
        </div>
      )}

      <div ref={containerRef} className={`mx-auto docx-container-white ${loading || error ? "hidden" : "block"}`} />
    </div>
  );
}

const renderFileViewer = (url: string) => {
  if (!url) return null;
  
  // Check if it's a URL or relative path, otherwise treat as plain text script
  const isUrl = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
  const hasFileExtension = /\.(pdf|docx|doc|pptx|ppt|png|jpg|jpeg|gif)$/i.test(url);
  
  if (!isUrl && !hasFileExtension) {
    return (
      <div className="p-6 overflow-auto h-full w-full bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{url}</p>
      </div>
    );
  }

  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.endsWith(".docx") || lowercaseUrl.endsWith(".doc")) {
    return <DocxPreview url={url} />;
  }
  
  if (lowercaseUrl.endsWith(".pdf") || lowercaseUrl.endsWith(".png") || lowercaseUrl.endsWith(".jpg") || lowercaseUrl.endsWith(".jpeg") || lowercaseUrl.endsWith(".gif")) {
    return (
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="Reference Doc Preview"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center bg-slate-50 dark:bg-zinc-950">
      <FileText size={48} className="text-slate-300 dark:text-zinc-700 animate-pulse" />
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Office Document Preview</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs">
          This file format is not supported for inline preview. Please download the file to view it.
        </p>
      </div>
      <a
        href={url}
        download
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition"
      >
        Download Document
      </a>
    </div>
  );
};

interface ExamGroupPlayerProps {
  examGroupId: number;
  examGroup: any;
  userId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function ExamGroupPlayer({
  examGroupId,
  examGroup,
  userId,
  onComplete,
  onCancel,
}: ExamGroupPlayerProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<Record<number, File>>({});
  const [recordingQuestionId, setRecordingQuestionId] = useState<number | null>(null);
  const [minimizedDocIds, setMinimizedDocIds] = useState<Record<number, boolean>>({});
  const [isFullscreenDocId, setIsFullscreenDocId] = useState<number | null>(null);

  const toggleDocMinimize = (id: number) => {
    setMinimizedDocIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const answersRef = React.useRef(answers);
  const videoFilesRef = React.useRef(selectedVideoFiles);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    videoFilesRef.current = selectedVideoFiles;
  }, [selectedVideoFiles]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const totalQuestions = examGroup?.questions?.length || 0;

  useEffect(() => {
    if (!examGroup?.questions) return;
    setQuestions(examGroup.questions);
    const submission = examGroup.submissions?.[0];
    if (submission) {
      setSubmitted(true);
      setResult(submission);
    }
    setLoading(false);
  }, [examGroup]);

  const submitLogic = async () => {
    if (submitted) return;
    const currentAnswers = { ...answersRef.current };
    const currentVideos = { ...videoFilesRef.current };

    if (questions.length > 0) {
      const missingAnswer = questions.some((q: any) => {
        const ans = currentAnswers[q.id];
        if (q.type === "MCQ") {
          return !ans || !Array.isArray(ans) || ans.length === 0;
        }
        if (q.type === "CQ") {
          return !ans || String(ans).trim() === "";
        }
        if (q.type === "Video") {
          const hasSelectedLocal = currentVideos[q.id] !== undefined;
          return (!ans || String(ans).trim() === "" || ans === "Uploading...") && !hasSelectedLocal;
        }
        return false;
      });

      if (missingAnswer) {
        toast.error("Answering all questions (MCQ, CQ, and Video) is mandatory before submitting the exam.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      toast.success("Submitting exam in the background...");

      const finalAnswers = { ...currentAnswers };
      const uploadKeys = Object.keys(currentVideos);
      for (const qId of uploadKeys) {
        const file = currentVideos[Number(qId)];
        if (file) {
          setAnswers(prev => ({ ...prev, [Number(qId)]: ["Uploading..."] }));
          const formData = new FormData();
          formData.append('file', file);
          const res = await api.post('/exam-groups/upload-test-video', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data?.url) {
            finalAnswers[Number(qId)] = [res.data.url];
            setAnswers(prev => ({ ...prev, [Number(qId)]: [res.data.url] }));
          } else {
            throw new Error("Failed to upload video response.");
          }
        }
      }

      setSelectedVideoFiles({});

      const answerArray = Object.entries(finalAnswers).map(([questionId, providedAnswer]) => ({
        questionId: Number(questionId),
        providedAnswer: Array.isArray(providedAnswer) ? providedAnswer : [String(providedAnswer)],
      }));

      if (answerArray.length === 0) {
        toast.error("No answers selected. Submitting empty exam.");
      }

      const res = await api.post(`/exam-groups/${examGroupId}/submit`, { answers: answerArray });
      setResult(res.data);
      setSubmitted(true);
      toast.success("Exam submitted successfully!");
      onComplete?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit exam.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => submitLogic();

  const selectAnswer = (question: any, optionKey: string) => {
    const qId = question.id;
    setAnswers((prev) => {
      if (!question.isMultipleAnswer) {
        // Single-select (radio): selecting another option replaces the previous one
        const current = Array.isArray(prev[qId]) ? prev[qId] : [];
        if (current.length === 1 && current[0] === optionKey) {
          const { [qId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [qId]: [optionKey] };
      }
      // Multiple-select (checkbox): toggle
      const current = Array.isArray(prev[qId]) ? prev[qId] : [];
      if (current.includes(optionKey)) {
        const next = current.filter((a: string) => a !== optionKey);
        if (next.length === 0) {
          const { [qId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [qId]: next };
      }
      return { ...prev, [qId]: [...current, optionKey] };
    });
  };

  const handleTextAnswer = (questionId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: [text] }));
  };

  const handleFileChange = (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedVideoFiles(prev => ({ ...prev, [questionId]: file }));
      setAnswers(prev => ({ ...prev, [questionId]: [file.name] }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading exam...</p>
      </div>
    );
  }

  if (submitted && result) {
    // Student visible marks = MCQ + CQ only (excludes Video)
    const studentVisibleMarks = result.studentVisibleMarks ??
      (result.answers || []).filter((ans: any) => ans.question?.type !== 'Video')
        .reduce((sum: number, ans: any) => sum + (ans.marksAwarded || 0), 0);
    const studentVisibleTotal = result.studentVisibleTotal ??
      (result.answers || []).filter((ans: any) => ans.question?.type !== 'Video')
        .reduce((sum: number, ans: any) => sum + (ans.question?.marks || 0), 0);

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fadeIn">
        <CheckCircle className="h-14 w-14 text-green-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Exam Submitted</h2>
        <p className="text-sm text-slate-500">Your answers have been auto-evaluated.</p>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col items-center gap-2 shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Marks Obtained</span>
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{studentVisibleMarks ?? 0}</span>
          {studentVisibleTotal > 0 && (
            <span className="text-xs text-slate-400">out of {studentVisibleTotal} marks</span>
          )}
        </div>
        {onCancel && (
          <button onClick={onCancel} className="mt-2 rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        {questions.map((q: any, idx: number) => (
          <div key={q.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
              <div className="flex-1">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2 leading-relaxed">{q.questionText}</p>
                <span className="text-[10px] text-slate-400 mt-1 inline-block">{q.marks} marks</span>
                <div className="mt-3 flex flex-col gap-2">
                  {q.type === 'MCQ' ? (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 inline-block">
                        {q.isMultipleAnswer ? "Select all that apply" : "Select one answer"}
                      </span>
                      {(q.options || []).map((opt: string, optIdx: number) => {
                        const optionKey = `option_${optIdx}`;
                        const currentAnswers = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                        const selected = currentAnswers.includes(optionKey);
                        return (
                          <button
                            key={optIdx}
                            onClick={() => selectAnswer(q, optionKey)}
                            className={`text-left text-base px-5 py-4 rounded-xl border transition flex items-center gap-3 ${
                              selected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                                : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300"
                            }`}
                          >
                            {q.isMultipleAnswer ? (
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "border-blue-500 bg-blue-600" : "border-slate-300 dark:border-zinc-700"}`}>
                                {selected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5"><path d="M20 6L9 17l-5-5" /></svg>}
                              </span>
                            ) : (
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selected ? "border-blue-500 bg-blue-600" : "border-slate-300 dark:border-zinc-700"}`}>
                                {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                            )}
                            {opt}
                          </button>
                        );
                      })}
                    </>
                  ) : q.type === 'CQ' ? (
                    <textarea
                      value={(answers[q.id]?.[0]) || ""}
                      onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                      rows={4}
                      className="w-full bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl border border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition p-4 resize-none outline-none"
                    />
                  ) : q.type === 'Video' ? (
                    <div className="flex flex-col gap-4 w-full">
                      {/* Document Viewer Block */}
                      {q.referenceScript && (
                        <div className="w-full flex flex-col gap-2">
                          <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/20 text-xs">
                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                              <FileText size={14} /> Reference Doc
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleDocMinimize(q.id)}
                              className="px-3 py-1 rounded-md text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                            >
                              {minimizedDocIds[q.id] ? "Maximize" : "Minimize"}
                            </button>
                          </div>
                          {!minimizedDocIds[q.id] && (
                            <div className={`border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950 flex flex-col transition-all ${
                              isFullscreenDocId === q.id 
                                ? "fixed inset-0 z-[100] h-screen w-screen p-4 bg-black/80 backdrop-blur-md" 
                                : "h-[450px] w-full"
                            }`}>
                              <div className="bg-slate-200 dark:bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-slate-300 dark:border-zinc-800 shrink-0">
                                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                  <FileText size={14} /> Reference Doc Preview
                                </span>
                              </div>
                              <div className="flex-1 overflow-auto h-full w-full bg-white relative">
                                {renderFileViewer(getAbsoluteDocUrl(q.referenceScript))}
                                <button
                                  type="button"
                                  onClick={() => setIsFullscreenDocId(prev => prev === q.id ? null : q.id)}
                                  className="absolute bottom-4 right-4 z-10 p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition flex items-center justify-center border border-blue-500 hover:scale-105"
                                  title={isFullscreenDocId === q.id ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                  {isFullscreenDocId === q.id ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video Actions Block */}
                      <div className="bg-slate-50 dark:bg-zinc-950/50 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                          <button
                            onClick={() => setRecordingQuestionId(q.id)}
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-md w-full sm:w-auto"
                          >
                            <Video size={18} /> Record Video
                          </button>
                          <div className="relative w-full sm:w-auto flex-1 sm:flex-none flex">
                            <input
                              type="file"
                              accept="video/*"
                              id={`file-upload-${q.id}`}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => handleFileChange(q.id, e)}
                            />
                            <label
                              htmlFor={`file-upload-${q.id}`}
                              className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 font-bold py-3 px-6 rounded-xl transition cursor-pointer w-full text-center"
                            >
                              <UploadCloud size={18} /> Upload Video
                            </label>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto text-center sm:text-right text-xs font-bold text-slate-500 dark:text-zinc-400">
                          {answers[q.id]?.[0] ? (
                            <div className="flex items-center justify-center sm:justify-end gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                              <CheckCircle size={14} /> 
                              <span className="truncate max-w-[150px] sm:max-w-[200px]" title={answers[q.id]?.[0]}>
                                {answers[q.id]?.[0]}
                              </span>
                            </div>
                          ) : (
                            "No video selected"
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 pb-12 border-t border-slate-200 dark:border-zinc-800 mt-4">
        {onCancel && (
          <button onClick={onCancel} className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition">
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 text-xs font-bold transition shadow-sm"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Exam"}
        </button>
      </div>

      {recordingQuestionId && (
        <WebcamRecorder 
          onCancel={() => setRecordingQuestionId(null)}
          onUpload={(file) => {
            if (recordingQuestionId) {
              setSelectedVideoFiles(prev => ({ ...prev, [recordingQuestionId]: file }));
              setAnswers(prev => ({ ...prev, [recordingQuestionId]: [file.name] }));
              setRecordingQuestionId(null);
            }
          }}
        />
      )}
    </div>
  );
}

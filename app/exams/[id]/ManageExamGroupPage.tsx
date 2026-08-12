"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/libs/api";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  Loader2,
  CheckCircle2,
  Pencil,
  UploadCloud,
  FileText,
  Video,
  ListChecks,
  MessageSquareText,
  Cpu,
  User,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import ExamGroupEvaluationView from "./ExamGroupEvaluationView";

const DocViewer = dynamic(
  () => import("@cyntler/react-doc-viewer"),
  { ssr: false }
);

type QuestionFormState = {
  questionText: string;
  type: string;
  options: string[];
  correctAnswers: string[];
  marks: string;
  accuracyMarks: string;
  evaluationType: string;
  referenceScript: string;
  referenceFileName: string;
  isMultipleAnswer: boolean;
};

const emptyQuestion: QuestionFormState = {
  questionText: "",
  type: "MCQ",
  options: ["", "", "", ""],
  correctAnswers: [],
  marks: "1",
  accuracyMarks: "0",
  evaluationType: "AI",
  referenceScript: "",
  referenceFileName: "",
  isMultipleAnswer: false,
};

const getAbsoluteDocUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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

export default function ManageExamGroupPage() {
  const params = useParams();
  const router = useRouter();
  const examGroupId = Number(params.id);

  const [examGroup, setExamGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "submissions">("questions");

  const [questions, setQuestions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [viewingSubmission, setViewingSubmission] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newQuestion, setNewQuestion] = useState<QuestionFormState>(emptyQuestion);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState<QuestionFormState>(emptyQuestion);
  const [isSavingQuestionId, setIsSavingQuestionId] = useState<number | null>(null);
  const [isDeletingQuestionId, setIsDeletingQuestionId] = useState<number | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [previewingDocId, setPreviewingDocId] = useState<number | null>(null);
  const [minimizedDocIds, setMinimizedDocIds] = useState<Record<number, boolean>>({});
  const [isFullscreenDocId, setIsFullscreenDocId] = useState<number | null>(null);

  const toggleDocMinimize = (id: number) => {
    setMinimizedDocIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmLabel: string;
  }>({ open: false, title: "", description: "", onConfirm: () => {}, confirmLabel: "Confirm" });

  const triggerConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmLabel = "Confirm",
  ) =>
    setConfirmState({ open: true, title, description, onConfirm, confirmLabel });

  useEffect(() => {
    if (!examGroupId) return;
    setLoading(true);
    Promise.all([
      api.get(`/exam-groups/${examGroupId}`),
      api.get(`/exam-groups/${examGroupId}/submissions`),
    ])
      .then(([egRes, subRes]) => {
        const eg = egRes.data;
        setExamGroup(eg);
        setQuestions(eg.questions || []);
        setSubmissions(subRes.data || []);
      })
      .catch(() => {
        toast.error("Failed to load exam group.");
        router.push("/exams");
      })
      .finally(() => setLoading(false));
  }, [examGroupId, router]);

  const reload = async () => {
    const egRes = await api.get(`/exam-groups/${examGroupId}`);
    const eg = egRes.data;
    setExamGroup(eg);
    setQuestions(eg.questions || []);
    const subRes = await api.get(`/exam-groups/${examGroupId}/submissions`);
    setSubmissions(subRes.data || []);
  };

  const handleAddOption = () => {
    setNewQuestion((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const handleRemoveOption = (index: number) => {
    if (newQuestion.options.length <= 2) {
      toast.error("At least 2 options are required.");
      return;
    }
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctAnswers: prev.correctAnswers.filter(
        (ans) => ans !== `option_${index}`,
      ),
    }));
  };

  const toggleCorrectAnswer = (optionIndex: number) => {
    const key = `option_${optionIndex}`;
    setNewQuestion((prev) => {
      if (!prev.isMultipleAnswer) {
        return { ...prev, correctAnswers: prev.correctAnswers.includes(key) ? [] : [key] };
      }
      return {
        ...prev,
        correctAnswers: prev.correctAnswers.includes(key)
          ? prev.correctAnswers.filter((a) => a !== key)
          : [...prev.correctAnswers, key],
      };
    });
  };

  const toggleEditCorrectAnswer = (optionIndex: number) => {
    const key = `option_${optionIndex}`;
    setEditQuestion((prev) => {
      if (!prev.isMultipleAnswer) {
        return { ...prev, correctAnswers: prev.correctAnswers.includes(key) ? [] : [key] };
      }
      return {
        ...prev,
        correctAnswers: prev.correctAnswers.includes(key)
          ? prev.correctAnswers.filter((a) => a !== key)
          : [...prev.correctAnswers, key],
      };
    });
  };

  const startEditing = (q: any) => {
    setEditingQuestionId(q.id);
    setEditQuestion({
      questionText: q.questionText || "",
      options: q.options || ["", "", "", ""],
      correctAnswers: q.correctAnswers || [],
      marks: String(q.marks ?? 1),
      type: q.type || "MCQ",
      accuracyMarks: String(q.accuracyMarks ?? q.marks ?? 0),
      evaluationType: q.evaluationType || "AI",
      referenceScript: q.referenceScript || "",
      referenceFileName: q.referenceScript ? q.referenceScript.split('/').pop() : "",
      isMultipleAnswer: q.isMultipleAnswer === true,
    });
  };

  const uploadReferenceDoc = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/exam-groups/upload-reference-doc", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  };

  const toSafeString = (value: unknown): string =>
    value === null || value === undefined ? "" : String(value);

  const isValidNumber = (value: unknown): boolean => {
    const str = toSafeString(value);
    return str.trim() !== "" && !isNaN(Number(value));
  };

  const numericInputClass = (value: unknown, min: number, baseClass: string): string =>
    `${baseClass} ${
      toSafeString(value) !== "" && (!isValidNumber(value) || Number(value) < min)
        ? "border-red-500 dark:border-red-500"
        : "border-slate-200 dark:border-zinc-800"
    }`;

  const handleAddQuestion = async (keepOpen: boolean) => {
    if (!examGroupId) return;

    if (!newQuestion.questionText.trim()) {
      toast.error("Question text is required.");
      return;
    }

    if (newQuestion.type === 'Video') {
      const videoMarksValid = ["accuracyMarks"].every(
        (key) => {
          const value = newQuestion[key as keyof QuestionFormState];
          return isValidNumber(value) && Number(value) >= 0;
        },
      );
      if (!videoMarksValid) {
        toast.error("Accuracy marks must be a valid number (0 or more).");
        return;
      }
    } else if (!isValidNumber(newQuestion.marks) || Number(newQuestion.marks) < 1) {
      toast.error("Total marks must be a valid number greater than 0.");
      return;
    }

    let filledOptions: string[] = [];
    if (newQuestion.type === 'MCQ') {
      filledOptions = newQuestion.options.map((o, i) => o.trim() || `Option ${i + 1}`);
      if (filledOptions.filter(Boolean).length < 2) {
        toast.error("Please provide at least 2 options for MCQ.");
        return;
      }
      if (newQuestion.correctAnswers.length === 0) {
        toast.error("Please select at least one correct answer.");
        return;
      }
      if (!newQuestion.isMultipleAnswer && newQuestion.correctAnswers.length > 1) {
        toast.error("This is a single-answer question. Please select only one correct answer.");
        return;
      }
    }

    if ((newQuestion.type === 'CQ' || newQuestion.type === 'Video') && newQuestion.evaluationType === 'AI' && !newQuestion.referenceScript) {
      toast.error("A reference document is required for AI-evaluated questions.");
      return;
    }

    if (newQuestion.type === 'Video' && questions.some((q) => q.type === 'Video')) {
      toast.error("Only one Video question is allowed per exam.");
      return;
    }

    setIsAddingQuestion(true);
    try {
      await api.post(
        `/exam-groups/${examGroupId}/questions`,
        {
          questions: [
            {
              questionText: newQuestion.questionText.trim(),
              type: newQuestion.type,
              options: newQuestion.type === 'MCQ' ? filledOptions : [],
              correctAnswers: newQuestion.type === 'MCQ' ? newQuestion.correctAnswers : [],
              marks: newQuestion.type === 'Video'
                ? (Number(newQuestion.accuracyMarks) || 0)
                : newQuestion.marks,
              accuracyMarks: newQuestion.type === 'Video' ? newQuestion.accuracyMarks : 0,
              evaluationType: newQuestion.evaluationType,
              referenceScript: newQuestion.referenceScript || undefined,
              isMultipleAnswer: newQuestion.type === 'MCQ' ? newQuestion.isMultipleAnswer : undefined,
            },
          ],
        },
      );
      toast.success("Question added!");
      setNewQuestion((prev) => ({ ...emptyQuestion, type: prev.type }));
      if (!keepOpen) {
        setShowAddForm(false);
      }
      reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add question.");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleEditQuestion = async () => {
    if (!examGroupId || !editingQuestionId) return;

    const filledOptions = editQuestion.type === 'MCQ'
      ? editQuestion.options.map((o, i) => o.trim() || `Option ${i + 1}`)
      : [];
    if (editQuestion.type === 'MCQ') {
      if (filledOptions.filter(Boolean).length < 2) {
        toast.error("Please provide at least 2 options.");
        return;
      }
      if (editQuestion.correctAnswers.length === 0) {
        toast.error("Please select at least one correct answer.");
        return;
      }
      if (!editQuestion.isMultipleAnswer && editQuestion.correctAnswers.length > 1) {
        toast.error("This is a single-answer question. Please select only one correct answer.");
        return;
      }
    }
    if (!editQuestion.questionText.trim()) {
      toast.error("Question text is required.");
      return;
    }
    if (editQuestion.type === 'Video') {
      const videoMarksValid = ["accuracyMarks"].every(
        (key) => {
          const value = editQuestion[key as keyof QuestionFormState];
          return isValidNumber(value) && Number(value) >= 0;
        },
      );
      if (!videoMarksValid) {
        toast.error("Accuracy marks must be a valid number (0 or more).");
        return;
      }
    } else if (!isValidNumber(editQuestion.marks) || Number(editQuestion.marks) < 1) {
      toast.error("Total marks must be a valid number greater than 0.");
      return;
    }
    if ((editQuestion.type === 'CQ' || editQuestion.type === 'Video') && editQuestion.evaluationType === 'AI' && !editQuestion.referenceScript) {
      toast.error("A reference document is required for AI-evaluated questions.");
      return;
    }

    setIsSavingQuestionId(editingQuestionId);
    try {
      await api.patch(
        `/exam-groups/${examGroupId}/questions/${editingQuestionId}`,
        {
          questionText: editQuestion.questionText.trim(),
          options: editQuestion.type === 'MCQ' ? filledOptions : undefined,
          correctAnswers: editQuestion.type === 'MCQ' ? editQuestion.correctAnswers : undefined,
          marks: editQuestion.type === 'Video'
            ? (Number(editQuestion.accuracyMarks) || 0)
            : editQuestion.marks,
          accuracyMarks: editQuestion.type === 'Video' ? editQuestion.accuracyMarks : undefined,
          evaluationType: editQuestion.type === 'MCQ' ? undefined : editQuestion.evaluationType,
          referenceScript: editQuestion.type === 'MCQ' ? undefined : (editQuestion.referenceScript || null),
          isMultipleAnswer: editQuestion.type === 'MCQ' ? editQuestion.isMultipleAnswer : undefined,
        }
      );
      toast.success("Question updated!");
      setEditingQuestionId(null);
      reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update question.");
    } finally {
      setIsSavingQuestionId(null);
    }
  };

  const confirmRemoveQuestion = (questionId: number) => {
    triggerConfirm(
      "Delete Question",
      "Are you sure you want to delete this question? This action cannot be undone.",
      async () => {
        setIsDeletingQuestionId(questionId);
        try {
          await api.delete(`/exam-groups/${examGroupId}/questions/${questionId}`);
          toast.success("Question removed.");
          reload();
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to remove question.");
        } finally {
          setIsDeletingQuestionId(null);
        }
      },
      "Delete",
    );
  };

  const openEditModal = () => {
    if (!examGroup) return;
    setEditForm({
      title: examGroup.title || "",
      description: examGroup.description || "",
      status: examGroup.status || "draft",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examGroupId) return;
    setIsSavingEdit(true);
    try {
      const payload: any = { ...editForm };

      await api.patch(`/exam-groups/${examGroupId}`, payload);
      toast.success("Exam updated!");
      setIsEditModalOpen(false);
      reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update exam group.");
    } finally {
      setIsSavingEdit(false);
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

  if (!examGroup) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-red-500">Exam not found.</p>
        <button
          onClick={() => router.push("/exams")}
          className="text-sm text-blue-600 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/exams")}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition dark:bg-zinc-900 dark:border-zinc-800"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider dark:text-blue-400">
              {examGroup.examGroupId}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
            <span className="text-xs text-slate-400">
              {questions.length} questions
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
              {examGroup.title}
            </h2>
            <button
              onClick={openEditModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto">
          {(
            ["questions", "submissions"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold px-4 whitespace-nowrap transition ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "questions" ? "Questions" : "Submissions"}
            </button>
          ))}
        </div>

        <div className="p-1">
          {/* QUESTIONS TAB */}
          {activeTab === "questions" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              {/* Add Question Card */}
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 p-6 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition dark:hover:border-blue-900 dark:hover:text-blue-400"
                >
                  <Plus size={18} />
                  Add Question
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleAddQuestion(false); }}
                  className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden flex flex-col relative animate-fadeIn"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewQuestion(emptyQuestion);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-1.5 rounded-full transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="p-6 pb-2 mt-4 flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, type: "MCQ" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          newQuestion.type === "MCQ"
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <ListChecks size={15} />
                        MCQ
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, type: "CQ" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          newQuestion.type === "CQ"
                            ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/25"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <MessageSquareText size={15} />
                        Creative (CQ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, type: "Video" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          newQuestion.type === "Video"
                            ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <Video size={15} />
                        Video
                      </button>
                    </div>

                    <textarea
                      required
                      rows={2}
                      placeholder="Type your question here..."
                      value={newQuestion.questionText}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          questionText: e.target.value,
                        })
                      }
                      className="w-full bg-transparent text-lg font-semibold text-slate-800 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none resize-none border-b border-transparent focus:border-slate-100 dark:focus:border-zinc-800 transition min-h-[60px]"
                    />
                  </div>

                  {newQuestion.type === 'MCQ' && (
                    <div className="px-6 py-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Options</p>
                        <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setNewQuestion({ ...newQuestion, isMultipleAnswer: false, correctAnswers: newQuestion.correctAnswers.length > 1 ? newQuestion.correctAnswers.slice(0, 1) : newQuestion.correctAnswers })}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${!newQuestion.isMultipleAnswer ? "bg-white shadow-sm text-slate-800 dark:bg-zinc-700 dark:text-zinc-50" : "text-slate-500 dark:text-zinc-400"}`}
                          >
                            One answer
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewQuestion({ ...newQuestion, isMultipleAnswer: true })}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${newQuestion.isMultipleAnswer ? "bg-white shadow-sm text-slate-800 dark:bg-zinc-700 dark:text-zinc-50" : "text-slate-500 dark:text-zinc-400"}`}
                          >
                            Multiple answers
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 -mt-1">{newQuestion.isMultipleAnswer ? "Students can select several options. Graded all-or-nothing." : "Students pick a single option."}</p>
                      {newQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3 group relative bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-2 border border-slate-100 dark:border-zinc-800/50 hover:border-blue-200 dark:hover:border-blue-900/30 transition shadow-sm">
                          <button
                            type="button"
                            onClick={() => toggleCorrectAnswer(index)}
                            className={`flex items-center justify-center shrink-0 ${newQuestion.isMultipleAnswer ? "w-5 h-5 rounded" : "w-5 h-5 rounded-full"} border transition-colors ${
                              newQuestion.correctAnswers.includes(`option_${index}`) 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                              : 'bg-white border-slate-300 dark:bg-zinc-900 dark:border-zinc-700 hover:border-blue-400'
                            }`}
                            title="Mark as correct"
                          >
                            {newQuestion.correctAnswers.includes(`option_${index}`) && <CheckCircle2 size={14} />}
                          </button>
                          
                          <input
                            type="text"
                            required={index < 2}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newQuestion.options];
                              newOptions[index] = e.target.value;
                              setNewQuestion({ ...newQuestion, options: newOptions });
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 bg-transparent text-sm font-medium text-slate-700 dark:text-zinc-200 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="text-sm text-blue-600 font-bold self-start mt-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                      >
                        <Plus size={16} /> Add Option
                      </button>
                    </div>
                  )}

                  {newQuestion.type === 'Video' && (
                    <div className="px-6 py-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Evaluation Mode</label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setNewQuestion({ ...newQuestion, evaluationType: "AI" })}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                              newQuestion.evaluationType === "AI"
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <Cpu size={15} />
                            AI Evaluation
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewQuestion({ ...newQuestion, evaluationType: "Manual" })}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                              newQuestion.evaluationType === "Manual"
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <User size={15} />
                            Manual Evaluation
                          </button>
                        </div>
                      </div>

                      {newQuestion.evaluationType === 'AI' && (
                        <AddRefDocInput
                          state={newQuestion}
                          setState={(patch) => setNewQuestion({ ...newQuestion, ...patch })}
                          onUpload={uploadReferenceDoc}
                        />
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Script Accuracy Marks</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={newQuestion.accuracyMarks}
                            onChange={(e) => setNewQuestion({ ...newQuestion, accuracyMarks: e.target.value })}
                            className={numericInputClass(newQuestion.accuracyMarks, 0, "w-full rounded-xl border bg-white py-2 px-3 text-sm focus:outline-none dark:bg-zinc-900")}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {newQuestion.type === 'CQ' && (
                    <div className="px-6 py-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Evaluation Mode</label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setNewQuestion({ ...newQuestion, evaluationType: "AI" })}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                              newQuestion.evaluationType === "AI"
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <Cpu size={15} />
                            AI Evaluation
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewQuestion({ ...newQuestion, evaluationType: "Manual" })}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                              newQuestion.evaluationType === "Manual"
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <User size={15} />
                            Manual Evaluation
                          </button>
                        </div>
                      </div>
                      {newQuestion.evaluationType === 'AI' && (
                        <AddRefDocInput
                          state={newQuestion}
                          setState={(patch) => setNewQuestion({ ...newQuestion, ...patch })}
                          onUpload={uploadReferenceDoc}
                        />
                      )}
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-zinc-950/50 border-t border-slate-100 dark:border-zinc-800 p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {newQuestion.type !== 'Video' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Marks</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={newQuestion.marks}
                          onChange={(e) =>
                            setNewQuestion({
                              ...newQuestion,
                              marks: e.target.value,
                            })
                          }
                          className={numericInputClass(newQuestion.marks, 1, "w-16 rounded-lg border bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-zinc-900 text-center font-bold shadow-sm")}
                        />
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Total Marks: {(Number(newQuestion.accuracyMarks) || 0)}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 justify-end mt-4 sm:mt-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewQuestion(emptyQuestion);
                        }}
                        className="rounded-xl px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion(true)}
                        disabled={isAddingQuestion}
                        className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-slate-700 dark:text-zinc-300 px-6 py-2 text-xs font-bold shadow-sm transition flex items-center gap-2"
                      >
                        {isAddingQuestion ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Save & Add Another
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion(false)}
                        disabled={isAddingQuestion}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 text-xs font-bold shadow-sm transition flex items-center gap-2"
                      >
                        {isAddingQuestion ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        {isAddingQuestion ? "Saving..." : "Save Question"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Questions List */}
              <div className="flex flex-col gap-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-sm overflow-hidden p-5 sm:p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700"
                  >
                    {editingQuestionId === q.id ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-50">Edit Question {idx + 1}</h4>
                          <button onClick={() => setEditingQuestionId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Question Text</label>
                          <textarea
                            required
                            value={editQuestion.questionText}
                            onChange={(e) => setEditQuestion({ ...editQuestion, questionText: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                            rows={3}
                            placeholder="E.g. What is the capital of France?"
                          />
                        </div>
                        {editQuestion.type === 'MCQ' && (
                          <>
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Options & Correct Answers</label>
                              <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setEditQuestion({ ...editQuestion, isMultipleAnswer: false, correctAnswers: editQuestion.correctAnswers.length > 1 ? editQuestion.correctAnswers.slice(0, 1) : editQuestion.correctAnswers })}
                                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${!editQuestion.isMultipleAnswer ? "bg-white shadow-sm text-slate-800 dark:bg-zinc-700 dark:text-zinc-50" : "text-slate-500 dark:text-zinc-400"}`}
                                >
                                  One answer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditQuestion({ ...editQuestion, isMultipleAnswer: true })}
                                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${editQuestion.isMultipleAnswer ? "bg-white shadow-sm text-slate-800 dark:bg-zinc-700 dark:text-zinc-50" : "text-slate-500 dark:text-zinc-400"}`}
                                >
                                  Multiple answers
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mb-1">Click the circle to mark an option as correct.</p>
                            {editQuestion.options.map((opt, optIdx) => {
                              const isCorrect = editQuestion.correctAnswers.includes(`option_${optIdx}`);
                              return (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleEditCorrectAnswer(optIdx)}
                                    className={`shrink-0 flex items-center justify-center border transition ${
                                      editQuestion.isMultipleAnswer ? "w-5 h-5 rounded" : "w-5 h-5 rounded-full"
                                    } ${
                                      isCorrect ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-zinc-700 hover:border-blue-400"
                                    }`}
                                  >
                                    {isCorrect && <CheckCircle2 size={12} />}
                                  </button>
                                  <input
                                    type="text"
                                    placeholder={`Option ${optIdx + 1}`}
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...editQuestion.options];
                                      newOpts[optIdx] = e.target.value;
                                      setEditQuestion({ ...editQuestion, options: newOpts });
                                    }}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                                  />
                                </div>
                              );
                            })}
                          </>
                        )}

                        {(editQuestion.type === 'CQ' || editQuestion.type === 'Video') && (
                          <>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evaluation Mode</label>
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => setEditQuestion({ ...editQuestion, evaluationType: "AI" })}
                                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                                    editQuestion.evaluationType === "AI"
                                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                  }`}
                                >
                                  <Cpu size={15} />
                                  AI Evaluation
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditQuestion({ ...editQuestion, evaluationType: "Manual" })}
                                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                                    editQuestion.evaluationType === "Manual"
                                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                  }`}
                                >
                                  <User size={15} />
                                  Manual Evaluation
                                </button>
                              </div>
                            </div>
                            {editQuestion.evaluationType === 'AI' && (
                              <AddRefDocInput
                                state={editQuestion}
                                setState={(patch) => setEditQuestion({ ...editQuestion, ...patch })}
                                onUpload={uploadReferenceDoc}
                              />
                            )}
                          </>
                        )}

                        {editQuestion.type === 'Video' && (
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Script Accuracy Marks</label>
                              <input type="text" inputMode="decimal" value={editQuestion.accuracyMarks} onChange={(e) => setEditQuestion({ ...editQuestion, accuracyMarks: e.target.value })} className={numericInputClass(editQuestion.accuracyMarks, 0, "w-full rounded-xl border bg-white py-2 px-3 text-xs focus:outline-none dark:bg-zinc-900")} />
                            </div>
                          </div>
                        )}
                        {editQuestion.type !== 'Video' ? (
                          <div className="flex flex-col gap-1 w-1/3">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marks</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editQuestion.marks}
                              onChange={(e) => setEditQuestion({ ...editQuestion, marks: e.target.value })}
                              className={numericInputClass(editQuestion.marks, 1, "w-full rounded-xl border bg-white py-2 px-3 text-xs focus:outline-none dark:bg-zinc-900")}
                            />
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            Total Marks: {(Number(editQuestion.accuracyMarks) || 0)}
                          </div>
                        )}
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleEditQuestion}
                            disabled={isSavingQuestionId === q.id}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold transition"
                          >
                            {isSavingQuestionId === q.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${
                              q.type === 'MCQ'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                : q.type === 'CQ'
                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                            }`}>
                              {q.type}
                            </span>
                            <span className="text-slate-500 dark:text-zinc-500 text-xs font-bold tracking-wider">
                              Q{idx + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(q)}
                              disabled={isDeletingQuestionId === q.id || isSavingQuestionId === q.id}
                              className="flex items-center gap-1.5 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmRemoveQuestion(q.id);
                              }}
                              disabled={isDeletingQuestionId === q.id || isSavingQuestionId === q.id}
                              className="flex items-center gap-1.5 bg-red-50/50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              {isDeletingQuestionId === q.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </div>

                        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2 leading-relaxed">
                          {q.questionText}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mb-5">
                          Marks: {q.marks}
                        </p>

                        {q.type === 'MCQ' && (
                          <div className="flex flex-col gap-2.5">
                            {(q.options || []).map((opt: string, optIdx: number) => {
                              const isCorrect = (q.correctAnswers || []).includes(`option_${optIdx}`);
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                                    isCorrect
                                      ? "border-green-500/30 bg-green-50/50 dark:border-green-500/20 dark:bg-green-950/10"
                                      : "border-slate-200 dark:border-zinc-800/80 bg-transparent hover:border-slate-300 dark:hover:border-zinc-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${
                                      isCorrect
                                        ? "bg-green-500 border-green-500 text-white shadow-sm"
                                        : "border-slate-300 dark:border-zinc-700 bg-transparent"
                                    }`}>
                                      {isCorrect && <CheckCircle2 size={12} strokeWidth={3} />}
                                    </div>
                                    <span className={`text-base font-medium ${isCorrect ? "text-green-700 dark:text-green-400" : "text-slate-700 dark:text-zinc-300"}`}>
                                      {opt}
                                    </span>
                                  </div>
                                  {isCorrect && (
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 dark:text-green-500 pl-3">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'Video' && (
                          <div className="flex flex-col gap-3 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-500 dark:text-zinc-400">Evaluation Mode:</span>
                              <span className="font-bold text-slate-800 dark:text-zinc-200">{q.evaluationType} Evaluation</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-center text-xs">
                              <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-100 dark:border-zinc-800/80">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Script Accuracy</p>
                                <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{q.accuracyMarks ?? q.marks} m</p>
                              </div>
                            </div>
                            {q.evaluationType === 'AI' && q.referenceScript && (
                              <div className="mt-1 flex flex-col gap-2">
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
                          </div>
                        )}

                        {q.type === 'CQ' && (
                          <div className="flex flex-col gap-3 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-500 dark:text-zinc-400">Evaluation Mode:</span>
                              <span className="font-bold text-slate-800 dark:text-zinc-200">{q.evaluationType} Evaluation</span>
                            </div>
                            {q.evaluationType === 'AI' && q.referenceScript && (
                              <div className="mt-1 flex flex-col gap-2">
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
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <BookOpen
                      size={32}
                      className="text-slate-300 dark:text-zinc-700"
                    />
                    <p className="text-sm text-slate-500">
                      No questions yet. Add one above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBMISSIONS TAB */}
          {activeTab === "submissions" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col gap-6 animate-fadeIn">
              <h4 className="font-bold text-slate-900 dark:text-zinc-50 text-sm">
                Submissions
              </h4>
              {submissions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No submissions yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            {sub.user.name}
                          </p>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            sub.status === 'Evaluated'
                              ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                              : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                          }`}>
                            {sub.status === 'Evaluated' ? 'Evaluated' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {sub.user.userId}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {sub.marksObtained} marks
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setViewingSubmission(sub)}
                          className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg transition"
                        >
                          View Answers
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.description}
        confirmText={confirmState.confirmLabel}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
            confirmLabel: "Confirm",
          });
        }}
        onCancel={() =>
          setConfirmState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
            confirmLabel: "Confirm",
          })
        }
      />

      {/* Edit Exam Group Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212] overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 mb-4">Edit Exam Group</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Title *</label>
                <input type="text" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900" rows={3} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition">Cancel</button>
                <button type="submit" disabled={isSavingEdit} className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold transition">
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {viewingSubmission && (
        <ExamGroupEvaluationView
          submission={viewingSubmission}
          examGroupId={examGroupId}
          onClose={() => setViewingSubmission(null)}
          onEvaluated={() => {
            // refresh submissions
            api.get(`/exam-groups/${examGroupId}/submissions`).then(subRes => {
              setSubmissions(subRes.data || []);
            });
          }}
        />
      )}
    </div>
  );
}

function AddRefDocInput({
  state,
  setState,
  onUpload,
}: {
  state: {
    referenceScript: string;
    referenceFileName: string;
    evaluationType: string;
  };
  setState: (patch: Partial<{ referenceScript: string; referenceFileName: string; evaluationType: string }>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [uploading, setUploading] = useState(false);
  
  // Infer if the current referenceScript is a file URL or raw text script
  const isUrl = state.referenceScript?.startsWith("http://") || 
                state.referenceScript?.startsWith("https://") || 
                state.referenceScript?.startsWith("/") || 
                (state.referenceScript?.length > 0 && state.referenceScript.includes("."));
  const [isTextMode, setIsTextMode] = useState(!isUrl && state.referenceScript ? true : false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      setState({ referenceScript: url, referenceFileName: file.name });
      toast.success("Reference document uploaded.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload reference document.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-slate-50/50 dark:bg-zinc-950/20 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reference Document/Script *</label>
          <p className="text-[9px] text-slate-500 mt-0.5">Gives the AI context to grade answers. Students cannot see it.</p>
        </div>
        
        {/* Toggle Mode Button Group */}
        <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg shrink-0 border border-slate-200/50 dark:border-zinc-700/50">
          <button
            type="button"
            onClick={() => {
              setIsTextMode(false);
              setState({ referenceScript: "", referenceFileName: "" });
            }}
            className={`px-3 py-1 text-[9px] font-bold rounded-md transition ${!isTextMode ? "bg-white shadow-sm text-slate-800 dark:bg-zinc-700 dark:text-zinc-50" : "text-slate-500 dark:text-zinc-400"}`}
          >
            File Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setIsTextMode(true);
              setState({ referenceScript: "", referenceFileName: "" });
            }}
            className={`px-3 py-1 text-[9px] font-bold rounded-md transition ${isTextMode ? "bg-white shadow-sm text-slate-800 dark:bg-zinc-700 dark:text-zinc-50" : "text-slate-500 dark:text-zinc-400"}`}
          >
            Text Mode
          </button>
        </div>
      </div>

      {isTextMode ? (
        <textarea
          required
          rows={4}
          value={state.referenceScript || ""}
          onChange={(e) => setState({ referenceScript: e.target.value, referenceFileName: "Plain Text Script" })}
          placeholder="Paste or write the reference script/text here..."
          className="w-full bg-white dark:bg-zinc-900 text-xs font-medium text-slate-800 dark:text-zinc-200 rounded-xl border border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition p-3 resize-none outline-none mt-1 shadow-inner"
        />
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <label className="relative flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 font-bold px-4 py-2.5 text-xs transition cursor-pointer">
            <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} disabled={uploading} />
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {uploading ? "Uploading..." : state.referenceScript ? "Replace document" : "Upload document"}
          </label>
          {state.referenceScript && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <FileText size={14} />
              <span className="truncate max-w-[200px]">{state.referenceFileName || state.referenceScript.split('/').pop()}</span>
              <button type="button" onClick={() => setState({ referenceScript: "", referenceFileName: "" })} className="text-slate-400 hover:text-red-500 transition p-0.5">
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

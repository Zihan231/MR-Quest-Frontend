"use client";

import { useState, useEffect } from "react";
import { api } from "@/libs/api";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  PlusCircle,
  Search,
  Filter,
  Loader2,
  BookOpen,
  X,
  ArrowRight,
} from "lucide-react";
import { SelectDropdown } from "./SelectDropdown";
import { ExamGroup } from "@/hooks/useExamGroups";
import { ExamGroupCard } from "@/components/ExamGroupCard";

export function ExamGroupManager() {
  const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteExamId, setDeleteExamId] = useState<number | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({ title: "", description: "", status: "draft" });
  const [isCreating, setIsCreating] = useState(false);

  const fetchExamGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/exam-groups", { params: { page, limit: 6, q: search || undefined, status: statusFilter || undefined } });
      const data = res.data;
      if (Array.isArray(data)) {
        setExamGroups(data);
        setMeta({ totalItems: data.length, totalPages: 1, currentPage: 1 });
      } else {
        setExamGroups(data.data || []);
        setMeta(data.meta || {});
      }
    } catch {
      setExamGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExamGroups(); }, [page, search, statusFilter]);

  const openCreateModal = () => {
    setCreateForm({ title: "", description: "", status: "draft" });
    setIsCreateModalOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setIsCreating(true);
    try {
      const payload: any = { ...createForm };
      const res = await api.post("/exam-groups", payload);
      const createdExam = res.data;

      toast.success("Task created successfully!");
      setIsCreateModalOpen(false);
      if (createdExam && createdExam.id) {
        window.location.href = `/exams/${createdExam.id}`;
      } else {
        fetchExamGroups();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create task.");
      setIsCreating(false);
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/exam-groups/${id}`);
      toast.success("Task moved to recycle bin.");
      setDeleteExamId(null);
      fetchExamGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const handleStatusChange = async (examGroupId: number, newStatus: "active" | "draft") => {
    try {
      await api.patch(`/exam-groups/${examGroupId}`, { status: newStatus });
      toast.success(`Task status updated to ${newStatus.toUpperCase()}`);
      setExamGroups(prev => prev.map(eg => eg.id === examGroupId ? { ...eg, status: newStatus } : eg));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update task status.");
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Tasks</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Create and manage tasks with MCQ, creative, and video questions.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm shrink-0 self-start sm:self-center"
        >
          <PlusCircle size={15} /> Create Task
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 max-w-2xl">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <SelectDropdown
              value={statusFilter}
              onChange={(v) => { setPage(1); setStatusFilter(v); }}
              options={[
                { value: "", label: "All statuses" },
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
              ariaLabel="Filter tasks by status"
            />
          </div>
        </div>
      </div>

      {loading && examGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading tasks...</p>
        </div>
      ) : examGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <BookOpen size={40} className="text-slate-300 dark:text-zinc-700" />
          <p className="text-sm text-slate-500">No tasks found.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examGroups.map((eg) => (
              <ExamGroupCard
                key={eg.id}
                examGroup={{ ...eg, totalQuestions: (eg as any).questions?.length ?? 0 }}
                onManage={() => { window.location.href = `/exams/${eg.id}`; }}
                onDelete={() => setDeleteExamId(eg.id)}
                onStatusChange={(newStatus) => handleStatusChange(eg.id, newStatus)}
                showActions
                userRole="admin"
              />
            ))}
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-xs text-slate-500">Loading tasks...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="text-xs font-semibold text-slate-500">
            Page {page} of {meta.totalPages} ({meta.totalItems ?? meta.currentPage} total tasks)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              Previous
            </button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .reduce<number[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push(-1);
                acc.push(p);
                return acc;
              }, [])
              .map((p) =>
                p === -1 ? (
                  <span key={`e-${p}`} className="px-1 text-xs text-slate-400 dark:text-zinc-500">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                      p === page
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ─────────────── CREATE EXAM MODAL ─────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">Create Task</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below. You can add questions after creating the task.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Title *</label>
                <input type="text" required value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Description</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900" rows={3} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Status</label>
                <SelectDropdown
                  value={createForm.status}
                  onChange={(v) => setCreateForm({ ...createForm, status: v })}
                  options={[
                    { value: "draft", label: "Draft (hidden from students)" },
                    { value: "active", label: "Active (visible to students)" },
                  ]}
                  className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  ariaLabel="Task status"
                />
                {createForm.status === "draft" && (
                  <p className="text-[11px] text-slate-400 mt-1">Questions you add are saved but students won't see this task until it's set to Active.</p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition">Cancel</button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold transition"
                >
                  {isCreating && <Loader2 size={14} className="animate-spin" />}
                  {isCreating ? "Creating..." : "Create Task"} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteExamId !== null}
        onCancel={() => setDeleteExamId(null)}
        onConfirm={() => deleteExamId && confirmDelete(deleteExamId)}
        title="Delete Task"
        message="Move this task to the recycle bin? You can restore it later from the Recycle Bin in your dashboard."
        confirmText="Move to Recycle Bin"
      />
    </div>
  );
}
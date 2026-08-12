"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RegionSelects } from "@/components/RegionSelects";
import { api } from "@/libs/api";
import {
  Users as UsersIcon,
  BookOpen,
  Search,
  PlusCircle,
  Eye,
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
  EyeOff,
  CalendarDays,
  FileText,
  Download,
  BarChart3,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  UserX,
  Activity,
  FileClock,
  HelpCircle,
  Trash2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-600" />
        <Sparkles className="absolute h-5 w-5 text-blue-500 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 animate-pulse">Loading workspace...</p>
    </div>
  );
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <div className="group relative inline-block cursor-pointer align-middle">
      <HelpCircle size={13} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors" />
      <div className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 scale-0 rounded-lg bg-slate-950 p-2.5 text-[11px] font-normal normal-case leading-relaxed text-white shadow-xl transition-all duration-200 group-hover:scale-100 dark:bg-zinc-800">
        {content}
        <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-slate-950 rotate-45 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

function TrashCountdown({ initialSeconds, onExpire }: { initialSeconds: number; onExpire: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const formatTime = (totalSecs: number) => {
    if (totalSecs <= 0) return "Purging...";
    const secs = totalSecs % 60;
    const mins = Math.floor((totalSecs / 60) % 60);
    const hours = Math.floor((totalSecs / 3600) % 24);
    const days = Math.floor(totalSecs / 86400);

    const pad = (num: number) => String(num).padStart(2, "0");

    if (days > 0) {
      return `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
      <Clock size={10} className="animate-pulse" /> {formatTime(secondsLeft)}
    </span>
  );
}

function StatCard({ icon, label, value, accent, tooltip }: { icon: React.ReactNode; label: string; value: any; accent: string; tooltip?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#121212] shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-zinc-50">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: accent }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, className = "" }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#121212] shadow-sm ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 dark:text-zinc-50">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
    active: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    completed: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    cancelled: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${map[status] || map.draft}`}>
      {status}
    </span>
  );
}

function PerformanceBadge({ level }: { level?: string | null }) {
  const map: Record<string, string> = {
    good: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    average: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    "below-average": "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  };
  const label: Record<string, string> = {
    good: "Good",
    average: "Average",
    "below-average": "Below Avg",
  };
  if (!level) return <span className="text-xs text-slate-400">No data</span>;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${map[level] || "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>
      {label[level] || level}
    </span>
  );
}

type FilterTone = "blue" | "emerald" | "amber" | "violet" | "cyan" | "rose";

function FilterGroup({
  label,
  tone,
  children,
  onReset,
  hasActive,
}: {
  label: string;
  tone: FilterTone;
  children: React.ReactNode;
  onReset?: () => void;
  hasActive?: boolean;
}) {
  const tones: Record<FilterTone, { container: string; label: string; dot: string; reset: string }> = {
    blue: {
      container: "border-blue-200 bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-500/5",
      label: "text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
      reset:
        "border-blue-200 bg-blue-100/80 text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-400",
    },
    emerald: {
      container: "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5",
      label: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
      reset:
        "border-emerald-200 bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-400",
    },
    amber: {
      container: "border-amber-200 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5",
      label: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
      reset:
        "border-amber-200 bg-amber-100/80 text-amber-700 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-400",
    },
    violet: {
      container: "border-violet-200 bg-violet-50/40 dark:border-violet-500/30 dark:bg-violet-500/5",
      label: "text-violet-700 dark:text-violet-400",
      dot: "bg-violet-500",
      reset:
        "border-violet-200 bg-violet-100/80 text-violet-700 hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-400",
    },
    cyan: {
      container: "border-cyan-200 bg-cyan-50/40 dark:border-cyan-500/30 dark:bg-cyan-500/5",
      label: "text-cyan-700 dark:text-cyan-400",
      dot: "bg-cyan-500",
      reset:
        "border-cyan-200 bg-cyan-100/80 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-400",
    },
    rose: {
      container: "border-rose-200 bg-rose-50/40 dark:border-rose-500/30 dark:bg-rose-500/5",
      label: "text-rose-700 dark:text-rose-800",
      dot: "bg-rose-500",
      reset:
        "border-rose-200 bg-rose-100/80 text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-400",
    },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-xl border p-3 ${t.container}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${t.label}`}>
          <span className={`h-2 w-2 rounded-full ${t.dot}`} />
          {label}
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActive}
            title={`Reset ${label} filters`}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm transition hover:shadow disabled:pointer-events-none disabled:opacity-30 ${t.reset}`}
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function DashboardPageContent() {
  const { name, role, email } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isAdminOrEmployee = role === "admin" || role === "employee";
  const isAdmin = role === "admin";
  const defaultTab = isAdminOrEmployee ? "overview" : "settings";
  const currentTab = searchParams.get("tab") || defaultTab;

  // Exams now live at /exams — redirect any stale dashboard exam tabs there
  useEffect(() => {
    if (currentTab === "manage-exam-groups" || currentTab === "exam-groups") {
      router.replace("/exams");
    }
  }, [currentTab, router]);

  // Overview data
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [examGroups, setExamGroups] = useState<any[]>([]);
  const [overviewActivity, setOverviewActivity] = useState<any>(null);
  const [overviewAtRisk, setOverviewAtRisk] = useState<any[]>([]);

  // User management state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [paginatedUserList, setPaginatedUserList] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotalItems, setUsersTotalItems] = useState(0);
  const [usersFilters, setUsersFilters] = useState<{
    division?: string;
    district?: string;
    upazila?: string;
    role?: string;
    performanceLevel?: string;
    minAvg?: string;
    maxAvg?: string;
    activeWithinDays?: string;
    sortBy?: string;
    order?: string;
  }>({});
  const [isUsersFiltersOpen, setIsUsersFiltersOpen] = useState(false);
  const activeFilterCount = [
    usersFilters.division,
    usersFilters.district,
    usersFilters.upazila,
    usersFilters.role,
    usersFilters.performanceLevel,
    usersFilters.minAvg,
    usersFilters.maxAvg,
    usersFilters.activeWithinDays,
  ].filter(Boolean).length;
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeeAddress, setEmployeeAddress] = useState("");
  const [employeeRegion, setEmployeeRegion] = useState<{ division?: string; district?: string; upazila?: string }>({});
  const [employeeFormError, setEmployeeFormError] = useState("");
  const [employeeFormSuccess, setEmployeeFormSuccess] = useState("");
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [perfModalUser, setPerfModalUser] = useState<any | null>(null);
  const [perfModalData, setPerfModalData] = useState<any | null>(null);
  const [isPerfLoading, setIsPerfLoading] = useState(false);

  // Recycle bin state
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [trashQuery, setTrashQuery] = useState("");
  const [trashSortOrder, setTrashSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

  // Confirm modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isLoading?: boolean;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, confirmText?: string) => {
    setConfirmState({ isOpen: true, title, message, onConfirm, confirmText });
  };

  // Reset password state
  const [showResetPassForm, setShowResetPassForm] = useState(false);
  const [resetPassForm, setResetPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [resetPassShow, setResetPassShow] = useState({ current: false, new: false, confirm: false });
  const [resetPassError, setResetPassError] = useState('');
  const [resetPassSuccess, setResetPassSuccess] = useState('');
  const [resetPassSubmitting, setResetPassSubmitting] = useState(false);

  // =========================================================================
  // OVERVIEW DATA
  // =========================================================================
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [examRes, activityRes, atRiskRes] = await Promise.all([
        api.get("/exam-groups", { params: { page: 1, limit: 100 } }),
        api.get("/monitoring/activity", { params: { days: 30 } }),
        api.get("/monitoring/at-risk", { params: { threshold: 20 } }),
      ]);
      const data = Array.isArray(examRes.data) ? examRes.data : (examRes.data.data || []);
      setExamGroups(data);
      setOverviewActivity(activityRes.data || null);
      setOverviewAtRisk(atRiskRes.data || []);
    } catch (err: any) {
      setOverviewError(err.response?.data?.message || "Failed to load exam data.");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === "overview") loadOverview();
  }, [currentTab, loadOverview]);

  // =========================================================================
  // RECYCLE BIN
  // =========================================================================
  const loadTrash = useCallback(async () => {
    setIsLoadingTrash(true);
    try {
      const res = await api.get("/exam-groups/trash", {
        params: { q: trashQuery || undefined, sortOrder: trashSortOrder },
      });
      setTrashItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load recycle bin.");
      setTrashItems([]);
    } finally {
      setIsLoadingTrash(false);
    }
  }, [trashQuery, trashSortOrder]);

  useEffect(() => {
    if (currentTab === "trash") loadTrash();
  }, [currentTab, loadTrash]);

  const restoreTrashItem = async (item: any) => {
    try {
      await api.post(`/exam-groups/${item.id}/restore`);
      toast.success(`"${item.title}" restored.`);
      loadTrash();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore exam group.");
    }
  };

  const permanentlyDeleteTrashItem = (item: any) => {
    triggerConfirm(
      "Delete Forever",
      `Permanently delete "${item.title}"? This cannot be undone and will remove all its questions, enrollments, and submissions.`,
      async () => {
        try {
          await api.delete(`/exam-groups/${item.id}/permanent`);
          toast.success("Exam group permanently deleted.");
          loadTrash();
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to delete exam group.");
        }
      },
      "Delete Forever",
    );
  };

  const emptyRecycleBin = () => {
    triggerConfirm(
      "Empty Recycle Bin",
      "Permanently delete everything in the recycle bin? This cannot be undone.",
      async () => {
        setIsEmptyingTrash(true);
        try {
          const res = await api.delete("/exam-groups/trash/empty");
          toast.success(res.data?.message || "Recycle bin emptied.");
          loadTrash();
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to empty recycle bin.");
        } finally {
          setIsEmptyingTrash(false);
        }
      },
      "Empty Recycle Bin",
    );
  };

  // =========================================================================
  // USER MANAGEMENT
  // =========================================================================
  const loadPaginatedUsers = useCallback(async (page: number = 1) => {
    setIsUsersLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (userSearchQuery.trim()) params.q = userSearchQuery.trim();
      if (usersFilters.division) params.division = usersFilters.division;
      if (usersFilters.district) params.district = usersFilters.district;
      if (usersFilters.upazila) params.upazila = usersFilters.upazila;
      if (usersFilters.role) params.role = usersFilters.role;
      if (usersFilters.performanceLevel) params.performanceLevel = usersFilters.performanceLevel;
      if (usersFilters.minAvg) params.minAvg = usersFilters.minAvg;
      if (usersFilters.maxAvg) params.maxAvg = usersFilters.maxAvg;
      if (usersFilters.activeWithinDays) params.activeWithinDays = usersFilters.activeWithinDays;
      if (usersFilters.sortBy) params.sortBy = usersFilters.sortBy;
      if (usersFilters.order) params.order = usersFilters.order;
      const res = await api.get("/auth/users", { params });
      const data = res.data;
      setPaginatedUserList(data.data || []);
      setUsersPage(data.meta?.currentPage || page);
      setUsersTotalPages(data.meta?.totalPages || 1);
      setUsersTotalItems(data.meta?.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [usersFilters, userSearchQuery]);

  const exportUsersCsv = useCallback(async () => {
    setIsExportingUsers(true);
    try {
      const params: Record<string, any> = {};
      if (usersFilters.division) params.division = usersFilters.division;
      if (usersFilters.district) params.district = usersFilters.district;
      if (usersFilters.upazila) params.upazila = usersFilters.upazila;
      if (usersFilters.role) params.role = usersFilters.role;
      if (usersFilters.performanceLevel) params.performanceLevel = usersFilters.performanceLevel;
      if (usersFilters.minAvg) params.minAvg = usersFilters.minAvg;
      if (usersFilters.maxAvg) params.maxAvg = usersFilters.maxAvg;
      if (usersFilters.activeWithinDays) params.activeWithinDays = usersFilters.activeWithinDays;
      if (usersFilters.sortBy) params.sortBy = usersFilters.sortBy;
      if (usersFilters.order) params.order = usersFilters.order;
      const res = await api.get("/auth/users/export", { params });
      const { csv, count } = res.data || {};
      if (!csv) {
        toast.error("No user data to export.");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} user record(s).`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to export users.");
    } finally {
      setIsExportingUsers(false);
    }
  }, [usersFilters]);

  useEffect(() => {
    if (currentTab === "users") {
      loadPaginatedUsers(usersPage);
    }
  }, [currentTab, usersPage, loadPaginatedUsers]);

  const loadPerformance = useCallback(async (userId: string) => {
    setIsPerfLoading(true);
    setPerfModalData(null);
    try {
      const res = await api.get(`/auth/users/${userId}/performance`);
      setPerfModalData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load performance data.");
    } finally {
      setIsPerfLoading(false);
    }
  }, []);

  useEffect(() => {
    if (perfModalUser) {
      loadPerformance(perfModalUser.userId);
    }
  }, [perfModalUser, loadPerformance]);

  const handleRoleChange = (userId: string, newRole: string) => {
    triggerConfirm(
      "Change User Clearance",
      `Are you sure you want to change this user's authorization role to ${newRole.toUpperCase()}? This modifies their dashboard panels.`,
      async () => {
        try {
          await api.patch(`/auth/users/${userId}/role`, { role: newRole });
          toast.success(`Clearance role changed to ${newRole.toUpperCase()} successfully!`);
          loadPaginatedUsers(usersPage);
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to update clearance role.");
        }
      },
      "Change Clearance"
    );
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeFormError("");
    setEmployeeFormSuccess("");

    if (!employeeEmail.trim() || !employeeName.trim() || !employeePassword.trim()) {
      setEmployeeFormError("Name, email, and password are required.");
      return;
    }

    setIsCreatingEmployee(true);
    try {
      await api.post("/auth/users/employee", {
        email: employeeEmail,
        name: employeeName,
        password: employeePassword,
        phoneNumber: employeePhone || undefined,
        address: employeeAddress || undefined,
        division: employeeRegion.division || undefined,
        district: employeeRegion.district || undefined,
        upazila: employeeRegion.upazila || undefined,
      });

      toast.success("Employee registered successfully!");
      setEmployeeFormSuccess("Employee registered successfully!");
      setEmployeeEmail("");
      setEmployeeName("");
      setEmployeePassword("");
      setEmployeePhone("");
      setEmployeeAddress("");
      setEmployeeRegion({});
      setShowEmployeePassword(false);

      loadPaginatedUsers(usersPage);

      setTimeout(() => {
        setIsCreateEmployeeModalOpen(false);
        setEmployeeFormSuccess("");
      }, 1500);
    } catch (err: any) {
      setEmployeeFormError(err.response?.data?.message || "Failed to register employee.");
    } finally {
      setIsCreatingEmployee(false);
    }
  };

  // =========================================================================
  // SETTINGS
  // =========================================================================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPassError('');
    setResetPassSuccess('');

    if (!resetPassForm.currentPassword || !resetPassForm.newPassword || !resetPassForm.confirmPassword) {
      setResetPassError('All password fields are required.');
      return;
    }
    if (resetPassForm.newPassword.length < 6) {
      setResetPassError('New password must be at least 6 characters long.');
      return;
    }
    if (resetPassForm.newPassword !== resetPassForm.confirmPassword) {
      setResetPassError('New passwords do not match.');
      return;
    }

    setResetPassSubmitting(true);
    try {
      await api.patch('/auth/reset-password', {
        currentPassword: resetPassForm.currentPassword,
        newPassword: resetPassForm.newPassword,
      });
      setResetPassSuccess('Password changed successfully.');
      setResetPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setResetPassError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetPassSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW RENDERERS
  // =========================================================================
  const renderAdminOverview = () => {
    if (overviewLoading) return <LoadingSpinner />;
    if (overviewError) {
      return (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {overviewError}
        </div>
      );
    }

    const active = examGroups.filter((eg) => eg.status === "active");
    const draft = examGroups.filter((eg) => eg.status === "draft");
    const completed = examGroups.filter((eg) => eg.status === "completed");
    const totalStudents = overviewActivity?.totalStudents ?? examGroups.reduce((sum, eg) => sum + (eg.totalStudents || 0), 0);
    const atRiskCount = overviewAtRisk.length;
    const recentExams = [...examGroups].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return (
      <div className="flex flex-col gap-6 pb-8 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              Welcome back, {name} <Sparkles className="text-yellow-500 h-5 w-5 animate-pulse" />
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Here is what is happening across your exam platform.
            </p>
          </div>
        </div>

        {/* ================= Section A: Exam Pipeline (blue family) ================= */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Exam Pipeline</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={<FileText size={18} />} label="Total Exams" value={examGroups.length} accent="#3b82f6" tooltip="Sum of all draft and active exams in the platform." />
            <StatCard icon={<UserCheck size={18} />} label="Active" value={active.length} accent="#0ea5e9" tooltip="Exams currently open and available for students to participate." />
            <StatCard icon={<FileClock size={18} />} label="Draft" value={draft.length} accent="#64748b" tooltip="Exams currently in preparation that are not yet visible to students." />
          </div>
        </div>

        {/* ================= Section B: Participants (violet/emerald family) ================= */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-500/20 dark:bg-violet-500/5">
          <div className="mb-4 flex items-center gap-2">
            <UsersIcon className="text-violet-600" size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Participants & Engagement</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={<UsersIcon size={18} />} label="Total Students" value={totalStudents} accent="#8b5cf6" tooltip="Total number of student accounts registered on this platform." />
            <StatCard icon={<UserCheck size={18} />} label="Active (30d)" value={overviewActivity?.activeCount ?? 0} accent="#10b981" tooltip="Unique students who logged in or submitted an exam within the last 30 days." />
            <StatCard icon={<UserX size={18} />} label="Inactive" value={overviewActivity?.inactiveCount ?? 0} accent="#f59e0b" tooltip="Registered students who have not had any login or exam activity in the last 30 days." />
            <StatCard icon={<Activity size={18} />} label="Engagement" value={`${overviewActivity?.activePercent ?? 0}%`} accent="#06b6d4" tooltip="Percentage of active students out of the total registered students (Active / Total)." />
          </div>
        </div>

        {/* ================= Section C: Needs Attention (amber/red family) ================= */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={18} />
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Needs Attention</h3>
                <InfoTooltip content="Students whose latest exam score dropped by 20% or more compared to their previous exam." />
              </div>
            </div>
            <span className={`text-xs font-bold ${atRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {atRiskCount > 0 ? `${atRiskCount} at-risk student${atRiskCount === 1 ? "" : "s"}` : "All clear"}
            </span>
          </div>
          {atRiskCount > 0 ? (
            <div className="flex flex-col gap-2">
              {overviewAtRisk.slice(0, 5).map((s: any) => (
                <div key={s.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-white/60 p-3.5 dark:border-red-900/40 dark:bg-[#121212]/60">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">
                      {s.name} <span className="font-mono text-xs font-normal text-slate-400">({s.userId})</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                      {s.previousExam?.title} → {s.latestExam?.title}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-red-600 dark:text-red-400">-{s.dropPercent}%</p>
                    <p className="text-xs text-slate-400">{s.previousExam?.scorePercent}% → {s.latestExam?.scorePercent}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" /> No students currently flagged as at-risk.
            </p>
          )}
        </div>

        {/* ================= Recent Exams ================= */}
        <Card title="Recent Exams" subtitle="Your latest created exams and their current status">
          {examGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <BookOpen size={36} className="text-slate-300 dark:text-zinc-700" />
              <p className="text-sm text-slate-500">No exams created yet.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800">
              {recentExams.slice(0, 4).map((eg) => (
                <div key={eg.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-zinc-50 truncate">{eg.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <CalendarDays size={11} />
                      {eg.totalStudents ?? 0} students
                    </p>
                  </div>
                  <StatusBadge status={eg.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderUserManagement = () => {
    const listToRender = paginatedUserList;

    return (
      <div className="flex flex-col gap-6 pb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">User Access Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Modify credentials, change clearance roles and overview workspace permissions.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-[#121212]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setUsersPage(1);
                    loadPaginatedUsers(1);
                  }
                }}
                placeholder="Search by name, email, or role..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
              <button
                onClick={() => setIsUsersFiltersOpen((o) => !o)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition shrink-0 ${
                  isUsersFiltersOpen
                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setUsersPage(1);
                  loadPaginatedUsers(1);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search
              </button>
              <button
                onClick={exportUsersCsv}
                disabled={isExportingUsers}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 shrink-0"
              >
                {isExportingUsers ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export CSV
              </button>
              <button
                onClick={() => {
                  setEmployeeFormError("");
                  setEmployeeFormSuccess("");
                  setIsCreateEmployeeModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shrink-0"
              >
                <PlusCircle size={15} /> Add Employee
              </button>
            </div>
          </div>

          {isUsersFiltersOpen && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 xl:grid-cols-4">
                <FilterGroup
                  label="Region"
                  tone="blue"
                  hasActive={!!usersFilters.division || !!usersFilters.district || !!usersFilters.upazila}
                  onReset={() => {
                    setUsersFilters((f) => ({ ...f, division: undefined, district: undefined, upazila: undefined }));
                    setUsersPage(1);
                  }}
                >
                  <RegionSelects
                    compact
                    tint="blue"
                    value={{ division: usersFilters.division, district: usersFilters.district, upazila: usersFilters.upazila }}
                    onChange={(r) => setUsersFilters((f) => ({ ...f, ...r }))}
                    includeClear={false}
                  />
                </FilterGroup>
                <FilterGroup
                  label="Role"
                  tone="emerald"
                  hasActive={!!usersFilters.role}
                  onReset={() => {
                    setUsersFilters((f) => ({ ...f, role: undefined }));
                    setUsersPage(1);
                  }}
                >
                  <select
                    value={usersFilters.role || ""}
                    onChange={(e) => setUsersFilters((f) => ({ ...f, role: e.target.value || undefined }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">All roles</option>
                    <option value="user">User</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </FilterGroup>
                <FilterGroup
                  label="Performance Level"
                  tone="amber"
                  hasActive={!!usersFilters.performanceLevel}
                  onReset={() => {
                    setUsersFilters((f) => ({ ...f, performanceLevel: undefined }));
                    setUsersPage(1);
                  }}
                >
                  <select
                    value={usersFilters.performanceLevel || ""}
                    onChange={(e) => setUsersFilters((f) => ({ ...f, performanceLevel: e.target.value || undefined }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Any level</option>
                    <option value="good">Good (80%+)</option>
                    <option value="average">Average (60-80%)</option>
                    <option value="below-average">Below Average (40-60%)</option>
                  </select>
                </FilterGroup>
                <FilterGroup
                  label="Avg Score Range"
                  tone="violet"
                  hasActive={!!usersFilters.minAvg || !!usersFilters.maxAvg}
                  onReset={() => {
                    setUsersFilters((f) => ({ ...f, minAvg: undefined, maxAvg: undefined }));
                    setUsersPage(1);
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      type="number" min={0} max={100} value={usersFilters.minAvg || ""}
                      onChange={(e) => setUsersFilters((f) => ({ ...f, minAvg: e.target.value || undefined }))}
                      placeholder="Min" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <input
                      type="number" min={0} max={100} value={usersFilters.maxAvg || ""}
                      onChange={(e) => setUsersFilters((f) => ({ ...f, maxAvg: e.target.value || undefined }))}
                      placeholder="Max" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </FilterGroup>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                  <FilterGroup
                    label="Active within"
                    tone="cyan"
                    hasActive={!!usersFilters.activeWithinDays}
                    onReset={() => {
                      setUsersFilters((f) => ({ ...f, activeWithinDays: undefined }));
                      setUsersPage(1);
                    }}
                  >
                    <select
                      value={usersFilters.activeWithinDays || ""}
                      onChange={(e) => setUsersFilters((f) => ({ ...f, activeWithinDays: e.target.value || undefined }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">Anytime</option>
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </FilterGroup>
                  <FilterGroup
                    label="Sort by"
                    tone="rose"
                    hasActive={!!usersFilters.sortBy || !!usersFilters.order}
                    onReset={() => {
                      setUsersFilters((f) => ({ ...f, sortBy: undefined, order: undefined }));
                      setUsersPage(1);
                    }}
                  >
                    <select
                      value={`${usersFilters.sortBy || "date"}|${usersFilters.order || "DESC"}`}
                      onChange={(e) => {
                        const [sortBy, order] = e.target.value.split("|");
                        setUsersFilters((f) => ({ ...f, sortBy, order }));
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="date|DESC">Joined: Newest</option>
                      <option value="date|ASC">Joined: Oldest</option>
                      <option value="marks|DESC">Total Marks: High</option>
                      <option value="marks|ASC">Total Marks: Low</option>
                      <option value="name|ASC">Name: A-Z</option>
                      <option value="name|DESC">Name: Z-A</option>
                    </select>
                  </FilterGroup>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setUsersFilters({});
                      setUsersPage(1);
                      loadPaginatedUsers(1);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => {
                      setUsersPage(1);
                      loadPaginatedUsers(1);
                    }}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-zinc-800">
                  <th className="py-3 px-4 font-semibold text-xs uppercase">User ID</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">Name</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">Role</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">Region</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase text-center">Exams</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase text-center">Avg Score</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase text-center">Best</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase text-center">Performance</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span>Querying user records...</span>
                      </div>
                    </td>
                  </tr>
                ) : listToRender.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  listToRender.map((u) => (
                    <tr key={u.userId} className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/10">
                      <td className="py-4 px-4 font-mono text-slate-500 dark:text-zinc-400 font-bold">{u.userId}</td>
                      <td className="py-4 px-4 font-medium text-slate-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={u.role} onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          <option value="user">User</option>
                          <option value="employee">Employee</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 dark:text-zinc-400">
                        {u.division ? (
                          [u.division, u.district, u.upazila].filter(Boolean).join(", ")
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-slate-700 dark:text-zinc-200">{u.totalExams || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-slate-700 dark:text-zinc-200">{u.avgScore ? `${u.avgScore}%` : "—"}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-slate-700 dark:text-zinc-200">{u.bestScore ? `${u.bestScore}%` : "—"}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <PerformanceBadge level={u.performanceLevel} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setPerfModalUser(u);
                            setPerfModalData(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/40"
                        >
                          <BarChart3 size={12} />
                          <span>Performance</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {isUsersLoading ? (
              <div className="flex justify-center items-center gap-2 py-8 text-slate-400 text-sm">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Querying user records...</span>
              </div>
            ) : listToRender.length === 0 ? (
              <p className="py-8 text-center text-slate-400 text-sm">No matching user accounts found.</p>
            ) : (
              listToRender.map((u) => (
                <div key={u.userId} className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-zinc-50 truncate">{u.name}</p>
                      <p className="font-mono text-xs text-slate-500 dark:text-zinc-400 font-bold">{u.userId}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 break-words">{u.email}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Region</p>
                      <p className="text-slate-600 dark:text-zinc-300 truncate">
                        {u.division ? [u.division, u.district, u.upazila].filter(Boolean).join(", ") : "N/A"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Performance</p>
                      <PerformanceBadge level={u.performanceLevel} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white p-2 dark:bg-zinc-900">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Exams</p>
                      <p className="font-bold text-slate-700 dark:text-zinc-200">{u.totalExams || 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2 dark:bg-zinc-900">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Avg</p>
                      <p className="font-bold text-slate-700 dark:text-zinc-200">{u.avgScore ? `${u.avgScore}%` : "—"}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2 dark:bg-zinc-900">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Best</p>
                      <p className="font-bold text-slate-700 dark:text-zinc-200">{u.bestScore ? `${u.bestScore}%` : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <select
                      value={u.role} onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <option value="user">User</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <button
                      onClick={() => {
                        setPerfModalUser(u);
                        setPerfModalData(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                      <BarChart3 size={12} />
                      <span>Performance</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {usersTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm animate-fadeIn">
              <span className="text-xs font-semibold text-slate-500">
                Page {usersPage} of {usersTotalPages} ({usersTotalItems} total users)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={usersPage <= 1}
                  onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  Previous
                </button>
                <button
                  disabled={usersPage >= usersTotalPages}
                  onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="flex flex-col gap-6 pb-8 animate-fadeIn">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Settings</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Review platform and account metrics configuration details.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#121212] shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-zinc-50 mb-4">Account Profile</h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-0.5">{name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-0.5">{email}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Clearance Role</label>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mt-0.5">{role}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#121212] shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-zinc-50">Reset Password</h3>
            <button type="button" onClick={() => { setShowResetPassForm(v => !v); setResetPassError(''); setResetPassSuccess(''); }} className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition">
              {showResetPassForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          {showResetPassForm && (
            <div className="mt-4 animate-fadeIn">
              {resetPassSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/30 dark:text-green-400">{resetPassSuccess}</div>
              )}
              {resetPassError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{resetPassError}</div>
              )}
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Current Password</label>
                  <div className="relative">
                    <input type={resetPassShow.current ? 'text' : 'password'} value={resetPassForm.currentPassword} onChange={e => setResetPassForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Enter current password" className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 pr-10 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:text-zinc-100" />
                    <button type="button" onClick={() => setResetPassShow(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">{resetPassShow.current ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">New Password</label>
                  <div className="relative">
                    <input type={resetPassShow.new ? 'text' : 'password'} value={resetPassForm.newPassword} onChange={e => setResetPassForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="At least 6 characters" className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 pr-10 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:text-zinc-100" />
                    <button type="button" onClick={() => setResetPassShow(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">{resetPassShow.new ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Confirm New Password</label>
                  <div className="relative">
                    <input type={resetPassShow.confirm ? 'text' : 'password'} value={resetPassForm.confirmPassword} onChange={e => setResetPassForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Re-enter new password" className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 pr-10 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:text-zinc-100" />
                    <button type="button" onClick={() => setResetPassShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">{resetPassShow.confirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                <button type="submit" disabled={resetPassSubmitting} className="self-start flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
                  {resetPassSubmitting ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // RECYCLE BIN VIEW
  // =========================================================================
  const renderTrash = () => {
    return (
      <div className="flex flex-col gap-6 pb-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Recycle Bin</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Deleted exam groups are kept here briefly before being permanently removed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTrash}
              disabled={isLoadingTrash}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw size={14} className={isLoadingTrash ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={emptyRecycleBin}
              disabled={trashItems.length === 0 || isEmptyingTrash}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              <Trash2 size={14} /> {isEmptyingTrash ? "Emptying..." : "Empty Recycle Bin"}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={trashQuery}
              onChange={(e) => setTrashQuery(e.target.value)}
              placeholder="Search deleted exams..."
              className="w-full rounded-xl border border-slate-200 bg-transparent pl-9 pr-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100"
            />
          </div>
          <button
            onClick={() => setTrashSortOrder((s) => (s === "DESC" ? "ASC" : "DESC"))}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw size={14} /> Sort: {trashSortOrder === "DESC" ? "Newest" : "Oldest"}
          </button>
        </div>

        {isLoadingTrash ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
            <Loader2 size={18} className="animate-spin" /> Loading recycle bin...
          </div>
        ) : trashItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-12 text-center">
            <Trash2 size={28} className="mx-auto text-slate-300 dark:text-zinc-700" />
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-zinc-400">Recycle bin is empty</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Deleted exam groups will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...trashItems].sort((a, b) => {
              const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
              const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
              return trashSortOrder === "DESC" ? timeB - timeA : timeA - timeB;
            }).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#121212]">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400">
                    <Trash2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-zinc-100">{item.title}</p>
                    <p className="text-[11px] font-mono text-slate-400">{item.examGroupId}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden sm:flex items-center gap-3">
                    {item.remainingSeconds !== undefined && (
                      <TrashCountdown initialSeconds={item.remainingSeconds} onExpire={loadTrash} />
                    )}
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock size={12} />
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleTimeString() : "—"}
                    </span>
                  </span>
                  <button
                    onClick={() => restoreTrashItem(item)}
                    className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700"
                  >
                    <RotateCcw size={13} /> Restore
                  </button>
                  <button
                    onClick={() => permanentlyDeleteTrashItem(item)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // VIEW DIRECTORY ROUTER
  // =========================================================================
  const renderViewContent = () => {
    if (isAdminOrEmployee) {
      switch (currentTab) {
        case "overview":
          return renderAdminOverview();
        case "users":
          return isAdmin ? renderUserManagement() : renderAdminOverview();
        case "trash":
          return renderTrash();
        case "settings":
          return renderSettings();
        default:
          return renderAdminOverview();
      }
    } else {
      switch (currentTab) {
        case "settings":
          return renderSettings();
        default:
          return renderSettings();
      }
    }
  };

  return (
    <div className="min-h-screen">
      {renderViewContent()}

      {/* Performance Details Modal */}
      {perfModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setPerfModalUser(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" /> Performance Analytics
              </h3>
              <button onClick={() => setPerfModalUser(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X size={18} />
              </button>
            </div>

            {isPerfLoading && (
              <div className="flex justify-center items-center gap-2 py-12 text-slate-400 text-sm">
                <Loader2 size={18} className="animate-spin" /> Analyzing performance records...
              </div>
            )}

            {!isPerfLoading && perfModalData && (
              <>
                <div className="flex flex-col items-center gap-2 pb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    {perfModalData.profile.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-slate-900 dark:text-zinc-50">{perfModalData.profile.name}</p>
                  <p className="font-mono text-xs text-slate-500 dark:text-zinc-400 font-bold">{perfModalData.profile.userId}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{perfModalData.profile.role}</span>
                    <PerformanceBadge level={perfModalData.overall?.performanceLevel} />
                  </div>
                  {perfModalData.profile.division && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {[perfModalData.profile.division, perfModalData.profile.district, perfModalData.profile.upazila].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-5">
                  <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Exams Taken</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-zinc-50">{perfModalData.overall?.totalExams || 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Marks</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-zinc-50">{perfModalData.overall?.totalMarks || 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Avg Score</p>
                    <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">{perfModalData.overall?.avgScore ? `${perfModalData.overall.avgScore}%` : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-zinc-900/60">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Best Score</p>
                    <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{perfModalData.overall?.bestScore ? `${perfModalData.overall.bestScore}%` : "—"}</p>
                  </div>
                </div>

                {(perfModalData.examHistory || []).length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-3">Exam History</h4>
                    <div className="flex flex-col gap-2">
                      {(perfModalData.examHistory as any[]).slice().reverse().map((rec) => (
                        <div key={rec.submissionId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 text-sm dark:border-zinc-800">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-700 dark:text-zinc-200 truncate">{rec.examTitle}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(rec.submittedAt).toLocaleDateString()} · Rank #{rec.rank} of {rec.totalParticipants} · {rec.marksObtained}/{rec.totalMarks} marks
                            </p>
                          </div>
                          <span className={`shrink-0 text-sm font-bold ${rec.scorePercent >= 60 ? "text-green-600 dark:text-green-400" : rec.scorePercent >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                            {rec.scorePercent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {perfModalData.weaknessAnalysis && (
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-3">Weakness Analysis</h4>
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm dark:bg-zinc-900/60">
                      <span className="text-slate-500 dark:text-zinc-400">Overall mastery</span>
                      <span className="font-bold text-slate-900 dark:text-zinc-50">{perfModalData.weaknessAnalysis.overallPercent}%</span>
                    </div>
                    {(perfModalData.weaknessAnalysis.breakdown || []).map((b: any) => (
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
                    {perfModalData.weaknessAnalysis.video && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-2">Video Interview Breakdown</p>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {["posture", "voice", "accuracy"].map((key) => {
                            const item = perfModalData.weaknessAnalysis.video[key];
                            return (
                              <div key={key} className="rounded-xl bg-slate-50 p-2 dark:bg-zinc-900/60">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{key}</p>
                                <p className="mt-1 font-bold text-slate-800 dark:text-zinc-100">{item ? `${item.percent}%` : "—"}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(!perfModalData.examHistory || perfModalData.examHistory.length === 0) && (
                  <p className="py-8 text-center text-sm text-slate-400">No exam submissions recorded for this user yet.</p>
                )}
              </>
            )}

            {!isPerfLoading && !perfModalData && (
              <p className="py-8 text-center text-sm text-slate-400">Unable to load performance data.</p>
            )}
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {isCreateEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setIsCreateEmployeeModalOpen(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#121212] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                <PlusCircle size={18} className="text-emerald-600" /> Register Employee
              </h3>
              <button onClick={() => setIsCreateEmployeeModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X size={18} />
              </button>
            </div>

            {employeeFormSuccess && (
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/30 dark:text-green-400">{employeeFormSuccess}</div>
            )}
            {employeeFormError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{employeeFormError}</div>
            )}

            <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Full Name</label>
                <input
                  type="text" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g. Alex Mercer" required
                  className="rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Email</label>
                <input
                  type="email" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)}
                  placeholder="employee@company.com" required
                  className="rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Password</label>
                <div className="relative">
                  <input
                    type={showEmployeePassword ? "text" : "password"} value={employeePassword} onChange={(e) => setEmployeePassword(e.target.value)}
                    placeholder="Min 6 characters" required
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 pr-10 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button" onClick={() => setShowEmployeePassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                  >
                    {showEmployeePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Phone Number (optional)</label>
                <input
                  type="text" value={employeePhone} onChange={(e) => setEmployeePhone(e.target.value)}
                  placeholder="e.g. +1 555-0100"
                  className="rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Address (optional)</label>
                <input
                  type="text" value={employeeAddress} onChange={(e) => setEmployeeAddress(e.target.value)}
                  placeholder="e.g. New York, NY"
                  className="rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Region (optional)</label>
                <RegionSelects
                  value={employeeRegion}
                  onChange={(r) => setEmployeeRegion({ ...employeeRegion, ...r })}
                  disabled={isCreatingEmployee}
                />
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button" onClick={() => setIsCreateEmployeeModalOpen(false)} disabled={isCreatingEmployee}
                  className="rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isCreatingEmployee}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isCreatingEmployee ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Registering...
                    </>
                  ) : (
                    "Register Employee"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isLoading={confirmState.isLoading}
        onConfirm={() => {
          setConfirmState((s) => ({ ...s, isOpen: false }));
          confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
      />
    </div>
  );
}

// =========================================================================
// STUDENT EXAM GROUPS LIST
// =========================================================================

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardPageContent />
    </Suspense>
  );
}

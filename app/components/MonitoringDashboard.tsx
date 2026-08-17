  "use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RegionSelects } from "@/components/RegionSelects";
import PerformanceModal from "@/components/PerformanceModal";
import { useUser } from "@/hooks/useUser";
import { api } from "@/libs/api";
import {
  Loader2,
  BarChart3,
  Download,
  RotateCcw,
  Users,
  GraduationCap,
  TrendingUp,
  ShieldAlert,
  Activity,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

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

function Card({ title, subtitle, children, className = "", tooltip, id, headerRight }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string; tooltip?: string; id?: string; headerRight?: React.ReactNode }) {
  return (
    <div id={id} className={`rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#121212] shadow-sm ${className}`}>
      {(title || headerRight) && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {title && <h3 className="font-bold text-slate-900 dark:text-zinc-50">{title}</h3>}
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
            {headerRight}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function MonitoringDashboard() {
  const { role } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [regionStats, setRegionStats] = useState<{ divisions: any[]; districts: any[] }>({ divisions: [], districts: [] });
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [activity, setActivity] = useState<any>(null);
  const [scoreDist, setScoreDist] = useState<any>({ buckets: [] });
  const [examGroups, setExamGroups] = useState<any[]>([]);

  const [regionFilter, setRegionFilter] = useState<{ division?: string; district?: string; upazila?: string }>({});
  const [examFilter, setExamFilter] = useState<string>("");
  const [threshold, setThreshold] = useState(20);
  const [thresholdDraft, setThresholdDraft] = useState("20");
  const [days, setDays] = useState(30);
  const [regionPage, setRegionPage] = useState(1);
  const [atRiskPage, setAtRiskPage] = useState(1);
  const [selectedAtRisk, setSelectedAtRisk] = useState<{ userId: string; name?: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const pendingScrollRef = useRef<string | null>(null);

  const buildParams = (region: { division?: string; district?: string; upazila?: string }, exam: string) => {
    const params: Record<string, any> = {};
    if (region.division) params.division = region.division;
    if (region.district) params.district = region.district;
    if (region.upazila) params.upazila = region.upazila;
    if (exam) params.examGroupId = exam;
    return params;
  };

  const scrollToPending = () => {
    if (!pendingScrollRef.current) return;
    const el = document.getElementById(pendingScrollRef.current);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    pendingScrollRef.current = null;
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(regionFilter, examFilter);
      const [lb, rs, ar, act, sd] = await Promise.all([
        api.get("/monitoring/leaderboard", { params: { ...params, limit: 7 } }),
        api.get("/monitoring/region-stats"),
        api.get("/monitoring/at-risk", { params: { threshold } }),
        api.get("/monitoring/activity", { params: { days } }),
        api.get("/monitoring/score-distribution", { params }),
      ]);

      setLeaderboard(lb.data || []);
      setRegionStats(rs.data || { divisions: [], districts: [] });
      setRegionPage(1);
      setAtRisk(ar.data || []);
      setAtRiskPage(1);
      setActivity(act.data || null);
      setScoreDist(sd.data || { buckets: [] });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load monitoring data.");
    } finally {
      setLoading(false);
    }
  }, [regionFilter, examFilter, threshold, days]);

  const loadLeaderboardSection = useCallback(async (region: { division?: string; district?: string; upazila?: string }, exam: string) => {
    setRefreshing("leaderboard");
    try {
      const params = buildParams(region, exam);
      const [lb, sd] = await Promise.all([
        api.get("/monitoring/leaderboard", { params: { ...params, limit: 7 } }),
        api.get("/monitoring/score-distribution", { params }),
      ]);
      setLeaderboard(lb.data || []);
      setScoreDist(sd.data || { buckets: [] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load leaderboard data.");
    } finally {
      setRefreshing(null);
      scrollToPending();
    }
  }, []);

  const loadAtRiskSection = useCallback(async (value: number) => {
    setRefreshing("at-risk");
    try {
      const res = await api.get("/monitoring/at-risk", { params: { threshold: value } });
      setAtRisk(res.data || []);
      setAtRiskPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load at-risk students.");
    } finally {
      setRefreshing(null);
      scrollToPending();
    }
  }, []);

  const loadActivitySection = useCallback(async (value: number) => {
    setRefreshing("engagement");
    try {
      const res = await api.get("/monitoring/activity", { params: { days: value } });
      setActivity(res.data || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load activity data.");
    } finally {
      setRefreshing(null);
      scrollToPending();
    }
  }, []);

  useEffect(() => {
    if (role === "admin") loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (loading || role !== "admin") return;
    if (window.location.hash === "#at-risk") {
      const el = document.getElementById("at-risk");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, role]);

  const loadExams = useCallback(async () => {
    try {
      const res = await api.get("/exam-groups", { params: { page: 1, limit: 100, status: "active" } });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setExamGroups(data);
    } catch {
      setExamGroups([]);
    }
  }, []);

  useEffect(() => {
    if (role === "admin") loadExams();
  }, [role, loadExams]);

  const exportRegionStats = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await api.get("/monitoring/regions/export");
      const { csv, count } = res.data || {};
      if (!csv) {
        toast.error("No region data to export.");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `region-stats-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} region record(s).`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to export region stats.");
    } finally {
      setIsExporting(false);
    }
  }, []);

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Admin access required</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm">
          Analytics dashboards are restricted to administrators. You do not have permission to view this page.
        </p>
      </div>
    );
  }

  const maxBucketCount = Math.max(...scoreDist.buckets.map((b: any) => b.count), 1);

  const scoreBuckets: any[] = scoreDist.buckets || [];
  const scoreTotal = scoreBuckets.reduce((s, b) => s + (b.count || 0), 0);
  const scoreMean = scoreTotal > 0 ? Math.round(scoreBuckets.reduce((s, b) => {
    const [mn, mx] = String(b.label).replace("%", "").split("-").map(Number);
    return s + (b.count || 0) * ((mn + mx) / 2);
  }, 0) / scoreTotal) : 0;
  const scorePassCount = scoreBuckets
    .filter((b) => String(b.label).startsWith("60-") || String(b.label).startsWith("80-"))
    .reduce((s, b) => s + (b.count || 0), 0);
  const scorePassRate = scoreTotal > 0 ? Math.round((scorePassCount / scoreTotal) * 100) : 0;
  const scoreBestBand = scoreBuckets.reduce((best, b) => (b.count || 0) > (best?.count || 0) ? b : best, null as any);
  const BUCKET_HEX: Record<string, string> = {
    "0-20%": "#ef4444",
    "20-40%": "#f97316",
    "40-60%": "#f59e0b",
    "60-80%": "#3b82f6",
    "80-100%": "#10b981",
  };
  const DONUT_CIRC = 2 * Math.PI * 54;

  const REGION_PAGE_SIZE = 10;
  const regionRows: any[] = [
    ...regionStats.divisions.map((d: any) => ({
      level: "Division",
      key: `div-${d.name}`,
      name: d.name,
      division: null,
      participants: d.participants,
      submissions: d.submissions,
      avgScore: d.avgScore,
      topPerformer: d.topPerformer,
    })),
    ...regionStats.districts.map((d: any) => ({
      level: "District",
      key: `dis-${d.division}-${d.name}`,
      name: d.name,
      division: d.division,
      participants: d.participants,
      submissions: d.submissions,
      avgScore: d.avgScore,
      topPerformer: d.topPerformer,
    })),
  ];
  const regionTotalPages = Math.max(1, Math.ceil(regionRows.length / REGION_PAGE_SIZE));
  const safeRegionPage = Math.min(regionPage, regionTotalPages);
  const regionStart = (safeRegionPage - 1) * REGION_PAGE_SIZE;
  const visibleRegionRows = regionRows.slice(regionStart, regionStart + REGION_PAGE_SIZE);

  const AT_RISK_PAGE_SIZE = 5;
  const atRiskTotalPages = Math.max(1, Math.ceil(atRisk.length / AT_RISK_PAGE_SIZE));
  const safeAtRiskPage = Math.min(atRiskPage, atRiskTotalPages);
  const atRiskStart = (safeAtRiskPage - 1) * AT_RISK_PAGE_SIZE;
  const visibleAtRisk = atRisk.slice(atRiskStart, atRiskStart + AT_RISK_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6 pb-8 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Platform Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Region performance, leaderboards, at-risk alerts, and engagement analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Refresh
          </button>
          <button
            onClick={exportRegionStats}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export Region CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading monitoring analytics...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      ) : (
        <>
          {activity && (
            <div id="engagement" className="relative flex flex-col gap-3 scroll-mt-6">
              {refreshing === "engagement" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px] dark:bg-[#121212]/60">
                  <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-md dark:bg-zinc-800 dark:text-blue-400">
                    <Loader2 size={15} className="animate-spin" /> Refreshing...
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Engagement Overview</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Activity Window</label>
                  <select
                    value={days}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDays(v);
                      pendingScrollRef.current = "engagement";
                      loadActivitySection(v);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={<Users size={18} />} label="Total Students" value={activity.totalStudents || 0} accent="#3b82f6" tooltip="Total number of student accounts registered on this platform." />
                <StatCard icon={<Activity size={18} />} label={`Active (${activity.days}d)`} value={activity.activeCount || 0} accent="#10b981" tooltip="Unique students who logged in or submitted a task within the active window." />
                <StatCard icon={<GraduationCap size={18} />} label="Inactive" value={activity.inactiveCount || 0} accent="#f59e0b" tooltip="Registered students who have not had any activity within the active window." />
                <StatCard icon={<TrendingUp size={18} />} label="Engagement Rate" value={`${activity.activePercent ?? 0}%`} accent="#8b5cf6" tooltip="Percentage of active students out of the total registered students (Active / Total)." />
              </div>
            </div>
          )}

          <div id="leaderboard" className="relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 scroll-mt-6 dark:border-zinc-800 dark:bg-[#121212] xl:flex-row xl:items-end">
            {refreshing === "leaderboard" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px] dark:bg-[#121212]/60">
                <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-md dark:bg-zinc-800 dark:text-blue-400">
                  <Loader2 size={15} className="animate-spin" /> Refreshing...
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <RegionSelects
                row
                compact
                value={regionFilter}
                onChange={(r) => {
                  const next = { ...regionFilter, ...r };
                  setRegionFilter(next);
                  pendingScrollRef.current = "leaderboard";
                  loadLeaderboardSection(next, examFilter);
                }}
                includeClear={false}
              />
            </div>
            <div className="flex w-full flex-col gap-1.5 sm:w-56">
              <label className="text-xs font-semibold text-slate-500">Task</label>
              <select
                value={examFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setExamFilter(v);
                  pendingScrollRef.current = "leaderboard";
                  loadLeaderboardSection(regionFilter, v);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">All tasks</option>
                {examGroups.map((eg) => (
                  <option key={eg.id} value={eg.id}>{eg.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
            <Card title="Regional Leaderboard" subtitle={`Top ${Math.min(leaderboard.length, 7)} performers by average score`} tooltip="Top performing students ranked by their overall average score in selected regions.">
              {leaderboard.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No submissions yet in the selected region.</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800">
                  {leaderboard.slice(0, 7).map((entry) => (
                    <div key={entry.userId} className="flex items-center gap-3 py-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        entry.rank === 1 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400"
                        : entry.rank === 2 ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                        : entry.rank === 3 ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-50">{entry.name}</p>
                        <p className="truncate text-xs text-slate-400">{entry.division || "N/A"}{entry.district ? ` · ${entry.district}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">{entry.avgScore}%</p>
                        <p className="text-xs text-slate-400">{entry.totalExams} task(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Score Distribution" subtitle="How student submissions fall across score bands" tooltip="Histogram showing student counts grouped by their task percentage scores.">
              {scoreBuckets.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No data available.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex shrink-0 flex-col items-center justify-center gap-2">
                      <svg width={132} height={132} viewBox="0 0 128 128">
                        <circle cx={64} cy={64} r={54} fill="none" strokeWidth={14} className="stroke-slate-100 dark:stroke-zinc-800" />
                        {(() => {
                          let acc = 0;
                          return scoreBuckets.map((b) => {
                            const frac = scoreTotal > 0 ? (b.count || 0) / scoreTotal : 0;
                            const len = frac * DONUT_CIRC;
                            const seg = (
                              <circle
                                key={b.label}
                                cx={64} cy={64} r={54}
                                fill="none" strokeWidth={14}
                                stroke={BUCKET_HEX[b.label] || "#94a3b8"}
                                strokeDasharray={`${Math.max(len, frac > 0 ? 1.5 : 0)} ${DONUT_CIRC}`}
                                strokeDashoffset={-acc}
                                transform="rotate(-90 64 64)"
                              />
                            );
                            acc += len;
                            return seg;
                          });
                        })()}
                      </svg>
                      <p className="text-center text-[11px] font-bold text-slate-500 dark:text-zinc-400">{scoreTotal} submissions</p>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                      {scoreBuckets.map((b) => (
                        <div key={b.label} className="flex items-center gap-3 group cursor-pointer">
                          <span className="w-16 shrink-0 text-xs font-semibold text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-100 transition-colors duration-300">{b.label}</span>
                          <div className="h-8 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full transition-transform duration-300 ease-out origin-left group-hover:scale-x-[1.025]"
                              style={{
                                width: `${Math.max((b.count / maxBucketCount) * 100, b.count > 0 ? 8 : 0)}%`,
                                background: `linear-gradient(90deg, ${BUCKET_HEX[b.label] || "#94a3b8"}aa, ${BUCKET_HEX[b.label] || "#94a3b8"})`,
                              }}
                            />
                          </div>
                          <span className="w-24 shrink-0 whitespace-nowrap text-right text-sm font-bold text-slate-700 dark:text-zinc-200">
                            {scoreTotal > 0 ? Math.round(((b.count || 0) / scoreTotal) * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
                    {[
                      { label: "Total Submissions", value: String(scoreTotal) },
                      { label: "Mean Score", value: `${scoreMean}%` },
                      { label: "Pass Rate (≥60%)", value: `${scorePassRate}%` },
                      { label: "Most Populated Band", value: scoreBestBand?.label || "—" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-zinc-900/60">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{s.label}</p>
                        <p className="mt-0.5 truncate text-sm font-bold text-slate-800 dark:text-zinc-100">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <Card title="Region Performance" subtitle="Participation and average scores per division and district" tooltip="Breakdown of student participation, total submissions, average scores, and top performer per region.">
            {regionStats.divisions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No region activity recorded yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 dark:border-zinc-800">
                      <th className="py-3 px-3 font-semibold text-xs uppercase">Level</th>
                      <th className="py-3 px-3 font-semibold text-xs uppercase">Region</th>
                      <th className="py-3 px-3 font-semibold text-xs uppercase text-center">Participants</th>
                      <th className="py-3 px-3 font-semibold text-xs uppercase text-center">Submissions</th>
                      <th className="py-3 px-3 font-semibold text-xs uppercase text-center">Avg Score</th>
                      <th className="py-3 px-3 font-semibold text-xs uppercase">Top Performer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRegionRows.map((d: any) => (
                      <tr key={d.key} className="border-b border-slate-100 dark:border-zinc-800">
                        <td className={`py-3 px-3 text-xs ${d.level === "Division" ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>{d.level}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-zinc-100">
                          {d.name} {d.division ? <span className="text-xs font-normal text-slate-400">({d.division})</span> : null}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-zinc-300">{d.participants}</td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-zinc-300">{d.submissions}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-zinc-100">{d.avgScore}%</td>
                        <td className="py-3 px-3 text-xs text-slate-500 dark:text-zinc-400">
                          {d.topPerformer ? `${d.topPerformer.name} (${Number(d.topPerformer.avgScore).toFixed(2)}%)` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {regionTotalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {regionStart + 1}–{Math.min(regionStart + REGION_PAGE_SIZE, regionRows.length)} of {regionRows.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeRegionPage <= 1}
                      onClick={() => setRegionPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                    >
                      Previous
                    </button>
                    {Array.from({ length: regionTotalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === regionTotalPages || Math.abs(p - safeRegionPage) <= 1)
                      .reduce<number[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push(-1);
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p) =>
                        p === -1 ? (
                          <span key={`e-${p}`} className="px-1 text-xs text-slate-400 dark:text-zinc-500">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setRegionPage(p)}
                            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                              p === safeRegionPage
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
                      disabled={safeRegionPage >= regionTotalPages}
                      onClick={() => setRegionPage((p) => Math.min(regionTotalPages, p + 1))}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              </>
            )}
          </Card>

          <Card
            id="at-risk"
            className="relative scroll-mt-6"
            title="At-Risk Students"
            subtitle={`Students whose latest score dropped more than ${threshold}% versus their previous task`}
            tooltip="Students whose latest task score dropped by more than the configured threshold compared to their previous task."
            headerRight={
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">At-Risk Drop %</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={thresholdDraft}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
                    setThresholdDraft(v);
                    if (v !== "") {
                      const n = Math.min(100, Math.max(1, parseInt(v, 10) || 20));
                      setThreshold(n);
                      pendingScrollRef.current = "at-risk";
                      loadAtRiskSection(n);
                    }
                  }}
                  onBlur={() => {
                    const n = parseInt(thresholdDraft, 10);
                    const fixed = Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : 20;
                    setThresholdDraft(String(fixed));
                    setThreshold(fixed);
                    pendingScrollRef.current = "at-risk";
                    loadAtRiskSection(fixed);
                  }}
                  className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            }
          >
            {refreshing === "at-risk" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px] dark:bg-[#121212]/60">
                <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-md dark:bg-zinc-800 dark:text-blue-400">
                  <Loader2 size={15} className="animate-spin" /> Refreshing...
                </span>
              </div>
            )}
            {atRisk.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <p className="text-sm text-slate-500">No at-risk students detected.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {visibleAtRisk.map((s: any) => (
                    <div
                      key={s.userId}
                      onClick={() => setSelectedAtRisk({ userId: s.userId, name: s.name })}
                      title="Open performance analytics"
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 cursor-pointer transition-colors hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/20 dark:hover:border-red-700"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-zinc-50">{s.name} <span className="font-mono text-xs text-slate-400">({s.userId})</span></p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {s.previousExam?.title} → {s.latestExam?.title} · {[s.division, s.district].filter(Boolean).join(", ") || "N/A"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">-{s.dropPercent}%</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{s.previousExam?.scorePercent}% → {s.latestExam?.scorePercent}%</p>
                      </div>
                    </div>
                  ))}
                </div>
                {atRiskTotalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing {atRiskStart + 1}–{Math.min(atRiskStart + AT_RISK_PAGE_SIZE, atRisk.length)} of {atRisk.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safeAtRiskPage <= 1}
                        onClick={() => setAtRiskPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                      >
                        Previous
                      </button>
                      {Array.from({ length: atRiskTotalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === atRiskTotalPages || Math.abs(p - safeAtRiskPage) <= 1)
                        .reduce<number[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push(-1);
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p) =>
                          p === -1 ? (
                            <span key={`e-${p}`} className="px-1 text-xs text-slate-400 dark:text-zinc-500">…</span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setAtRiskPage(p)}
                              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                                p === safeAtRiskPage
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
                        disabled={safeAtRiskPage >= atRiskTotalPages}
                        onClick={() => setAtRiskPage((p) => Math.min(atRiskTotalPages, p + 1))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      <PerformanceModal user={selectedAtRisk} onClose={() => setSelectedAtRisk(null)} />
    </div>
  );
}
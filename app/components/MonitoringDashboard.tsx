  "use client";

import { useCallback, useEffect, useState } from "react";
import { RegionSelects } from "@/components/RegionSelects";
import { useUser } from "@/hooks/useUser";
import { api } from "@/libs/api";
import {
  Loader2,
  BarChart3,
  Download,
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

function Card({ title, subtitle, children, className = "", tooltip }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string; tooltip?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#121212] shadow-sm ${className}`}>
      {title && (
        <div className="mb-4">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-slate-900 dark:text-zinc-50">{title}</h3>
            {tooltip && <InfoTooltip content={tooltip} />}
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
  const [days, setDays] = useState(30);
  const [isExporting, setIsExporting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (regionFilter.division) params.division = regionFilter.division;
      if (regionFilter.district) params.district = regionFilter.district;
      if (regionFilter.upazila) params.upazila = regionFilter.upazila;
      if (examFilter) params.examGroupId = examFilter;

      const [lb, rs, ar, act, sd] = await Promise.all([
        api.get("/monitoring/leaderboard", { params: { ...params, limit: 10 } }),
        api.get("/monitoring/region-stats"),
        api.get("/monitoring/at-risk", { params: { threshold } }),
        api.get("/monitoring/activity", { params: { days } }),
        api.get("/monitoring/score-distribution", { params }),
      ]);

      setLeaderboard(lb.data || []);
      setRegionStats(rs.data || { divisions: [], districts: [] });
      setAtRisk(ar.data || []);
      setActivity(act.data || null);
      setScoreDist(sd.data || { buckets: [] });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load monitoring data.");
    } finally {
      setLoading(false);
    }
  }, [regionFilter, examFilter, threshold, days]);

  useEffect(() => {
    if (role === "admin") loadAll();
  }, [role, loadAll]);

  const loadExams = useCallback(async () => {
    try {
      const res = await api.get("/exam-groups", { params: { page: 1, limit: 100 } });
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
        <button
          onClick={exportRegionStats}
          disabled={isExporting}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export Region CSV
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#121212]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[260px] flex-1">
            <RegionSelects
              value={regionFilter}
              onChange={(r) => setRegionFilter((prev) => ({ ...prev, ...r }))}
              includeClear={false}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Exam</label>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All exams</option>
              {examGroups.map((eg) => (
                <option key={eg.id} value={eg.id}>{eg.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">At-Risk Drop %</label>
            <input
              type="number" min={1} max={100} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 20)}
              className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Activity Window</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={<Users size={18} />} label="Total Students" value={activity.totalStudents || 0} accent="#3b82f6" tooltip="Total number of student accounts registered on this platform." />
              <StatCard icon={<Activity size={18} />} label={`Active (${activity.days}d)`} value={activity.activeCount || 0} accent="#10b981" tooltip="Unique students who logged in or submitted an exam within the active window." />
              <StatCard icon={<GraduationCap size={18} />} label="Inactive" value={activity.inactiveCount || 0} accent="#f59e0b" tooltip="Registered students who have not had any activity within the active window." />
              <StatCard icon={<TrendingUp size={18} />} label="Engagement Rate" value={`${activity.activePercent ?? 0}%`} accent="#8b5cf6" tooltip="Percentage of active students out of the total registered students (Active / Total)." />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Regional Leaderboard" subtitle={`Top ${Math.min(leaderboard.length, 10)} performers by average score`} tooltip="Top performing students ranked by their overall average score in selected regions.">
              {leaderboard.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No submissions yet in the selected region.</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800">
                  {leaderboard.map((entry) => (
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
                        <p className="text-xs text-slate-400">{entry.totalExams} exam(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Score Distribution" subtitle="How student submissions fall across score bands" tooltip="Histogram showing student counts grouped by their exam percentage scores.">
              {scoreDist.buckets.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No data available.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {scoreDist.buckets.map((b: any) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs font-semibold text-slate-500 dark:text-zinc-400">{b.label}</span>
                      <div className="h-5 flex-1 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${b.label.startsWith("0-") ? "bg-red-500" : b.label.startsWith("20-") ? "bg-orange-500" : b.label.startsWith("40-") ? "bg-amber-500" : b.label.startsWith("60-") ? "bg-blue-500" : "bg-green-500"}`}
                          style={{ width: `${Math.max((b.count / maxBucketCount) * 100, b.count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm font-bold text-slate-700 dark:text-zinc-200">{b.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card title="Region Performance" subtitle="Participation and average scores per division and district" tooltip="Breakdown of student participation, total submissions, average scores, and top performer per region.">
            {regionStats.divisions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No region activity recorded yet.</p>
            ) : (
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
                    {regionStats.divisions.map((d: any) => (
                      <tr key={`div-${d.name}`} className="border-b border-slate-100 dark:border-zinc-800">
                        <td className="py-3 px-3 text-xs font-bold text-blue-600 dark:text-blue-400">Division</td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-zinc-100">{d.name}</td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-zinc-300">{d.participants}</td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-zinc-300">{d.submissions}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-zinc-100">{d.avgScore}%</td>
                        <td className="py-3 px-3 text-xs text-slate-500 dark:text-zinc-400">
                          {d.topPerformer ? `${d.topPerformer.name} (${d.topPerformer.avgScore}%)` : "—"}
                        </td>
                      </tr>
                    ))}
                    {regionStats.districts.map((d: any) => (
                      <tr key={`dis-${d.division}-${d.name}`} className="border-b border-slate-100 dark:border-zinc-800">
                        <td className="py-3 px-3 text-xs text-slate-400">District</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-zinc-200">{d.name} <span className="text-xs text-slate-400">({d.division})</span></td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-zinc-300">{d.participants}</td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-zinc-300">{d.submissions}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-zinc-100">{d.avgScore}%</td>
                        <td className="py-3 px-3 text-xs text-slate-500 dark:text-zinc-400">
                          {d.topPerformer ? `${d.topPerformer.name} (${d.topPerformer.avgScore}%)` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="At-Risk Students"
            subtitle={`Students whose latest score dropped more than ${threshold}% versus their previous exam`}
            tooltip="Students whose latest exam score dropped by more than the configured threshold compared to their previous exam."
          >
            {atRisk.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <p className="text-sm text-slate-500">No at-risk students detected.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {atRisk.map((s: any) => (
                  <div key={s.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
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
            )}
          </Card>
        </>
      )}
    </div>
  );
}
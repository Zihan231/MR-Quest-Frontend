"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { api } from "@/libs/api";
let cachedDivisions = null;
const cachedDistricts = {};
const cachedUpazilas = {};


export interface RegionValue {
  division?: string;
  district?: string;
  upazila?: string;
}

interface RegionSelectsProps {
  value: RegionValue;
  onChange: (value: RegionValue) => void;
  disabled?: boolean;
  includeClear?: boolean;
  compact?: boolean;
  tint?: "blue" | "slate";
  className?: string;
  row?: boolean;
}

const selectCls =
  "w-full rounded-xl border border-slate-200 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 disabled:opacity-50";

const compactSelectCls =
  "w-full rounded-xl border border-slate-200 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 disabled:opacity-50";

export function RegionSelects({
  value,
  onChange,
  disabled,
  includeClear = true,
  compact = false,
  tint = "slate",
  className = "",
  row = false,
}: RegionSelectsProps) {
  const [divisions, setDivisions] = useState<{ name: string; districtCount: number }[]>([]);
  const [districts, setDistricts] = useState<{ name: string; upazilaCount: number }[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);
  const labelColor = tint === "blue" ? "text-blue-600 dark:text-blue-400" : "text-slate-500";

  useEffect(() => {
    setLoadingDivisions(true);
    api
      .get("/regions/divisions")
      .then((res) => setDivisions(res.data || []))
      .catch(() => setDivisions([]))
      .finally(() => setLoadingDivisions(false));
  }, []);

  const loadDistricts = useCallback(async (division: string) => {
    if (!division) {
      setDistricts([]);
      setUpazilas([]);
      return;
    }
    setLoadingDistricts(true);
    try {
      const res = await api.get(`/regions/divisions/${encodeURIComponent(division)}/districts`);
      setDistricts(res.data || []);
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadUpazilas = useCallback(async (division: string, district: string) => {
    if (!division || !district) {
      setUpazilas([]);
      return;
    }
    setLoadingUpazilas(true);
    try {
      const res = await api.get(
        `/regions/divisions/${encodeURIComponent(division)}/districts/${encodeURIComponent(district)}/upazilas`,
      );
      setUpazilas(res.data || []);
    } catch {
      setUpazilas([]);
    } finally {
      setLoadingUpazilas(false);
    }
  }, []);

  useEffect(() => {
    if (value.division) {
      loadDistricts(value.division);
    } else {
      setDistricts([]);
      setUpazilas([]);
    }
  }, [value.division, loadDistricts]);

  useEffect(() => {
    if (value.division && value.district) {
      loadUpazilas(value.division, value.district);
    } else {
      setUpazilas([]);
    }
  }, [value.division, value.district, loadUpazilas]);

  const update = (next: RegionValue) => {
    onChange({ ...value, ...next });
  };

  const clear = () => {
    setDistricts([]);
    setUpazilas([]);
    onChange({});
  };

  if (row) {
    return (
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-3 ${className}`}>
        <div className="flex flex-col gap-1.5">
          <label className={`flex items-center gap-1 font-semibold ${compact ? "text-xs" : "text-sm"} ${labelColor}`}>
            <MapPin size={12} /> Division
          </label>
          <select
            value={value.division || ""}
            disabled={disabled}
            onChange={(e) => {
              const division = e.target.value;
              update({ division: division || undefined, district: undefined, upazila: undefined });
            }}
            className={compact ? compactSelectCls : selectCls}
          >
            <option value="">Select division</option>
            {divisions.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`flex items-center gap-1 font-semibold ${compact ? "text-xs" : "text-sm"} ${labelColor}`}>
            <MapPin size={12} /> District
          </label>
          <select
            value={value.district || ""}
            disabled={disabled || !value.division || loadingDistricts}
            onChange={(e) => {
              const district = e.target.value;
              update({ district: district || undefined, upazila: undefined });
            }}
            className={compact ? compactSelectCls : selectCls}
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`flex items-center gap-1 font-semibold ${compact ? "text-xs" : "text-sm"} ${labelColor}`}>
            <MapPin size={12} /> Upazila
          </label>
          <select
            value={value.upazila || ""}
            disabled={disabled || !value.district || loadingUpazilas}
            onChange={(e) => update({ upazila: e.target.value || undefined })}
            className={compact ? compactSelectCls : selectCls}
          >
            <option value="">Select upazila</option>
            {upazilas.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={`flex items-center gap-1 font-semibold ${compact ? "text-xs" : "text-sm"} ${labelColor}`}>
            <MapPin size={12} /> Division
          </label>
          <select
            value={value.division || ""}
            disabled={disabled}
            onChange={(e) => {
              const division = e.target.value;
              update({ division: division || undefined, district: undefined, upazila: undefined });
            }}
            className={compact ? compactSelectCls : selectCls}
          >
            <option value="">Select division</option>
            {divisions.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.districtCount} districts)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`flex items-center gap-1 font-semibold ${compact ? "text-xs" : "text-sm"} ${labelColor}`}>
            <MapPin size={12} /> District
          </label>
          <select
            value={value.district || ""}
            disabled={disabled || !value.division || loadingDistricts}
            onChange={(e) => {
              const district = e.target.value;
              update({ district: district || undefined, upazila: undefined });
            }}
            className={compact ? compactSelectCls : selectCls}
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={`flex items-center gap-1 font-semibold ${compact ? "text-xs" : "text-sm"} ${labelColor}`}>
            <MapPin size={12} /> Upazila
          </label>
          <select
            value={value.upazila || ""}
            disabled={disabled || !value.district || loadingUpazilas}
            onChange={(e) => update({ upazila: e.target.value || undefined })}
            className={compact ? compactSelectCls : selectCls}
          >
            <option value="">Select upazila</option>
            {upazilas.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {includeClear && (
          <div className="flex flex-col gap-1.5 sm:justify-end">
            <button
              type="button"
              disabled={disabled || !value.division}
              onClick={clear}
              className={`rounded-xl border border-slate-200 px-3.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                compact ? "py-1.5 text-xs" : "py-2.5 text-xs"
              }`}
            >
              Clear Region
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

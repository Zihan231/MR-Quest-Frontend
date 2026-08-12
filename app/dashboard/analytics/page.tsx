"use client";

import { MonitoringDashboard } from "@/components/MonitoringDashboard";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 pb-8 animate-fadeIn">
      <MonitoringDashboard />
    </div>
  );
}
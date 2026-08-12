"use client";

import DashboardLayout from "../dashboard/layout";

export default function ExamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

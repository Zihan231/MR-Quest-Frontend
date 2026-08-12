"use client";

import { useUser } from "@/hooks/useUser";
import { StudentResultsList } from "@/components/StudentResultsList";
import { Loader2 } from "lucide-react";

export default function ResultsPage() {
  const { role } = useUser();

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading results...</p>
      </div>
    );
  }

  return <StudentResultsList />;
}

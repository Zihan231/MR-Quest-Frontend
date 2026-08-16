"use client";

import { useState } from "react";
import { Download, FileText, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function resolveUrl(refScript: string): string {
  return refScript.startsWith("http") ? refScript : `${API_URL}${refScript}`;
}

export function ReferenceDocViewer({ referenceScript, label = "Reference Document" }: { referenceScript: string; label?: string }) {
  const [open, setOpen] = useState(true);

  if (!referenceScript) return null;

  const isFile =
    referenceScript.startsWith("http") ||
    referenceScript.startsWith("/") ||
    (referenceScript.length < 200 && /\.(pdf|docx|doc|pptx|ppt)$/i.test(referenceScript));

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-950/50 transition"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
          <FileText size={15} />
          {label}
          {isFile && referenceScript.includes(".") && (
            <span className="text-[10px] text-slate-400 font-semibold uppercase">({referenceScript.split('/').pop()})</span>
          )}
        </span>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-zinc-800 p-3">
          {!isFile ? (
            <p className="text-xs text-slate-600 dark:text-zinc-300 whitespace-pre-wrap">{referenceScript}</p>
          ) : (() => {
            const scriptUrl = resolveUrl(referenceScript);
            const isPdf = /\.(pdf)$/i.test(referenceScript);
            const isDoc = /\.(docx|doc|pptx|ppt)$/i.test(referenceScript);

            if (isPdf) {
              return (
                <div className="flex flex-col gap-2">
                  <iframe src={scriptUrl} className="w-full h-80 border border-slate-200 dark:border-zinc-800 rounded-lg" />
                  <button
                    type="button"
                    onClick={() => window.open(scriptUrl, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[10px] transition uppercase tracking-wider self-end mt-1 border border-blue-100 dark:border-blue-900/30"
                  >
                    <Download size={12} />
                    Download PDF ({referenceScript.split('/').pop()})
                  </button>
                </div>
              );
            } else if (isDoc) {
              const embedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(scriptUrl)}&embedded=true`;
              return (
                <div className="flex flex-col gap-2">
                  <iframe src={embedUrl} className="w-full h-80 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white" />
                  <button
                    type="button"
                    onClick={() => window.open(scriptUrl, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[10px] transition uppercase tracking-wider self-end mt-1 border border-blue-100 dark:border-blue-900/30"
                  >
                    <Download size={12} />
                    Download Document ({referenceScript.split('/').pop()})
                  </button>
                </div>
              );
            }
            return (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 size={16} className="animate-spin text-slate-400" />
                <p className="text-xs text-slate-400">This file type cannot be previewed inline.</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

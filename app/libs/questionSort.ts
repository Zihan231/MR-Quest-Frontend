export const TYPE_ORDER: Record<string, number> = {
  MCQ: 0,
  CQ: 1,
  Video: 2,
};

export const TYPE_ACCENT_STYLES: Record<string, string> = {
  MCQ: "border-l-blue-500",
  CQ: "border-l-emerald-500",
  Video: "border-l-amber-500",
};

export const TYPE_CHIP_STYLES: Record<string, string> = {
  MCQ: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
  CQ: "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
  Video: "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
};

const DEFAULT_ACCENT_STYLE = "border-l-slate-300 dark:border-l-zinc-700";
const DEFAULT_CHIP_STYLE =
  "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300";

export function getTypeAccentClass(type?: string): string {
  return TYPE_ACCENT_STYLES[type ?? ""] ?? DEFAULT_ACCENT_STYLE;
}

export function getTypeChipClass(type?: string): string {
  return TYPE_CHIP_STYLES[type ?? ""] ?? DEFAULT_CHIP_STYLE;
}

export function sortByType<T>(
  items: T[],
  typeOf: (item: T) => string | undefined,
): T[] {
  return [...items].sort((a, b) => {
    const orderA = TYPE_ORDER[typeOf(a) ?? ""] ?? 99;
    const orderB = TYPE_ORDER[typeOf(b) ?? ""] ?? 99;
    return orderA - orderB;
  });
}
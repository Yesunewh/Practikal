import { ChevronRight } from 'lucide-react';

export interface HierarchyLevelItem {
  id: string;
  level: number;
  name: string;
}

/**
 * Horizontal “ladder” of defined hierarchy levels (from terminology) — shown above the branch tree.
 */
export default function HierarchyLevelsGraphic({ levels }: { levels: HierarchyLevelItem[] }) {
  const sorted = [...levels].sort((a, b) => a.level - b.level);
  if (sorted.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-stretch gap-y-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Defined hierarchy levels"
    >
      {sorted.map((t, i) => (
        <div key={t.id} className="flex min-w-0 items-center">
          {i > 0 && (
            <div className="mx-2 flex shrink-0 items-center gap-1 px-1 text-emerald-400 sm:mx-3 sm:px-1.5" aria-hidden>
              <span className="h-0.5 w-4 rounded-full bg-emerald-200 sm:w-6" />
              <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
              <span className="h-0.5 w-4 rounded-full bg-emerald-200 sm:w-6" />
            </div>
          )}
          <div
            role="listitem"
            className="flex items-center gap-4 rounded-2xl border-2 border-emerald-50 bg-white px-5 py-4 shadow-xl shadow-emerald-500/5 transition-all hover:border-emerald-200 hover:shadow-emerald-500/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-600/20">
              L{t.level}
            </span>
            <span className="truncate text-base font-black text-neutral-800">{t.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

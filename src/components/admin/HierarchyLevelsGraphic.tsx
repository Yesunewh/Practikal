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
      className="flex flex-wrap items-stretch gap-y-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Defined hierarchy levels"
    >
      {sorted.map((t, i) => (
        <div key={t.id} className="flex min-w-0 items-center">
          {i > 0 && (
            <div className="mx-1 flex shrink-0 items-center gap-0.5 px-0.5 text-indigo-400 sm:mx-2 sm:px-1" aria-hidden>
              <span className="h-0.5 w-3 rounded-full bg-indigo-300 sm:w-5" />
              <ChevronRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" strokeWidth={2.25} />
              <span className="h-0.5 w-3 rounded-full bg-indigo-300 sm:w-5" />
            </div>
          )}
          <div
            role="listitem"
            className="flex min-w-[7.5rem] max-w-[14rem] items-center gap-2.5 rounded-2xl border border-violet-200/90 bg-white px-3 py-2.5 shadow-sm shadow-violet-200/30 sm:min-w-0 sm:max-w-none sm:px-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-200 to-indigo-200 text-xs font-bold text-indigo-950 shadow-inner ring-1 ring-white/80">
              L{t.level}
            </span>
            <span className="truncate text-sm font-semibold text-neutral-800">{t.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

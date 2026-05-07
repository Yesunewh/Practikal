import type { ReactNode } from 'react';
import StructureHierarchyIllustration from './StructureHierarchyIllustration';

interface AdminHierarchyPageShellProps {
  title: string;
  /** Optional — omit for title-only hero */
  subtitle?: string;
  children: ReactNode;
}

/**
 * Shared layout for /admin/terminology and /admin/hierarchy — hero includes the structure graphic (not the app header).
 */
export default function AdminHierarchyPageShell({ title, subtitle, children }: AdminHierarchyPageShellProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
      <div className="border-b border-emerald-50 bg-gradient-to-br from-emerald-50/30 via-white to-transparent px-6 py-4 sm:px-8 sm:py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black tracking-tight text-neutral-900 sm:text-2xl">{title}</h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-xs font-bold leading-relaxed text-neutral-500 sm:text-sm">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 justify-center sm:justify-end">
            <div className="rounded-2xl border border-emerald-50 bg-white px-4 py-3 shadow-xl shadow-emerald-500/5">
              <StructureHierarchyIllustration className="mx-auto h-12 w-auto max-w-[min(100%,12rem)] sm:h-14 sm:max-w-[14rem]" />
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

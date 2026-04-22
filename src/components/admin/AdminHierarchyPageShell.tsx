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
    <div className="overflow-hidden rounded-2xl border border-indigo-100/90 bg-white shadow-sm">
      <div className="border-b border-indigo-100/80 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/50 px-5 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-indigo-950 sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-indigo-950/75 sm:text-base">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 justify-center lg:justify-end">
            <div className="rounded-2xl border border-violet-200/80 bg-white/90 px-6 py-4 shadow-sm shadow-violet-200/40">
              <StructureHierarchyIllustration className="mx-auto h-[7.5rem] w-auto max-w-[min(100%,17.5rem)] sm:h-[8.5rem] sm:max-w-[19rem]" />
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

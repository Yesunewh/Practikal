/**
 * Read-only branch “org chart” from live tree data (all nodes expanded visually).
 */
export default function BranchHierarchyDiagram({
  roots,
  getTypeLabel,
}: {
  roots: any[];
  getTypeLabel: (typeId: string) => string;
}) {
  if (!roots?.length) return null;

  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-b from-white via-indigo-50/30 to-violet-50/40 px-3 py-4 shadow-sm sm:px-5 sm:py-5">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-800/55">
        Branch tree overview
      </p>
      <div className="overflow-x-auto pb-1">
        <ul className="m-0 flex list-none flex-wrap justify-center gap-6 p-0 sm:gap-8">
          {roots.map((node) => (
            <DiagramSubtree key={node.id} node={node} getTypeLabel={getTypeLabel} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function DiagramSubtree({ node, getTypeLabel }: { node: any; getTypeLabel: (typeId: string) => string }) {
  const children = (node.SubUnits || node.children || []) as any[];

  return (
    <li className="flex min-w-0 flex-col items-center">
      <div className="min-w-[6.5rem] max-w-[11rem] rounded-xl border-2 border-indigo-300/90 bg-white px-3 py-2 text-center shadow-md shadow-indigo-900/[0.06]">
        <div className="truncate text-sm font-semibold text-neutral-900" title={node.name}>
          {node.name}
        </div>
        <div className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-indigo-600">
          {getTypeLabel(node.type_id)}
        </div>
      </div>
      {children.length > 0 && (
        <div className="flex w-full flex-col items-center">
          <div className="h-3 w-0.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
          <ul className="m-0 mt-0 flex list-none flex-wrap justify-center gap-3 border-t-2 border-indigo-200/90 pt-3 sm:gap-4">
            {children.map((c) => (
              <DiagramSubtree key={c.id} node={c} getTypeLabel={getTypeLabel} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

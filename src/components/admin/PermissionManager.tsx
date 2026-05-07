import { useState, useEffect } from 'react';
import {
  useGetAvailablePermissionsQuery,
  useAllocatePermissionMutation,
  useGetUnitTreeQuery,
} from '../../store/apiSlice/practikalApi';
import {
  ShieldAlert,
  ShieldCheck,
  GitFork,
  Lock,
  Activity,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { User } from '../../types';
import { useI18n } from '../../i18n/I18nContext';

type UnitTreeNode = { id: string; name: string; children?: UnitTreeNode[] };

export default function PermissionManager({ currentUser }: { currentUser: User }) {
  const { messages } = useI18n();
  const p = messages.admin.permissions;
  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.user_type === 'SUPERADMIN';
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN';
  const orgIdRaw = currentUser.orgId as string | number | undefined | null;
  const orgId =
    orgIdRaw !== undefined && orgIdRaw !== null && String(orgIdRaw).trim() !== ''
      ? String(orgIdRaw)
      : undefined;
  // UI is read-only based on user request
  const canModifyBranchAllocations = false;
  const canGrantOnBranch = false;

  const { data: permsRes, isLoading: loadingPerms, refetch: refetchPerms } = useGetAvailablePermissionsQuery(orgId);
  const { data: treeRes, isLoading: loadingTree } = useGetUnitTreeQuery(orgId);
  const [allocatePerm, { isLoading: isAllocating }] = useAllocatePermissionMutation();

  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedPermissionId) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPermissionId(null);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [selectedPermissionId]);

  if (loadingPerms || loadingTree)
    return <div className="p-6 text-gray-500 animate-pulse">{p.loadingMatrix}</div>;

  const permissions = permsRes?.data || [];
  const rootUnits = treeRes?.data || [];

  const selectedPerm = permissions.find((perm: { id: string }) => perm.id === selectedPermissionId);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAllocation = async (permissionId: string, unitId: string | null = null, effect: 'GRANT' | 'DENY') => {
    if (isOrgAdmin) return;
    try {
      const useSystem = isSuperAdmin && !unitId && !orgId;
      await allocatePerm({
        permissionId,
        target_type: unitId ? 'UNIT' : useSystem ? 'SYSTEM' : 'ORGANIZATION',
        target_id: unitId ?? (useSystem ? null : orgId ?? null),
        effect,
      }).unwrap();
      refetchPerms();
      alert(effect === 'GRANT' ? p.toastGrantSuccess : p.toastDenySuccess);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      alert(msg || p.toastAllocateFail);
    }
  };

  const renderTree = (nodes: UnitTreeNode[]) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <ul className="ml-2 mt-2 space-y-2 border-l-2 border-gray-100 pl-6">
        {nodes.map((node) => {
          const isExpanded = expandedNodes.has(node.id);
          const hasChildren = node.children && node.children.length > 0;

          return (
            <li key={node.id} className="relative">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2 hover:border-emerald-300">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleNode(node.id)}
                    className="flex-shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                  >
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )
                    ) : (
                      <span className="inline-block w-[18px]" />
                    )}
                  </button>
                  <GitFork size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-800">{node.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {canModifyBranchAllocations ? (
                    <>
                      {canGrantOnBranch ? (
                        <button
                          type="button"
                          onClick={() => handleAllocation(selectedPermissionId!, node.id, 'GRANT')}
                          disabled={isAllocating}
                          className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          {p.grant}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleAllocation(selectedPermissionId!, node.id, 'DENY')}
                        disabled={isAllocating}
                        className="rounded border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        {p.deny}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              {isExpanded && node.children && renderTree(node.children)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Permission list */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <ShieldAlert className="text-amber-500" />
            {p.title}
          </h2>
          {!isSuperAdmin && !isOrgAdmin && (
            <div
              role="note"
              className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950"
            >
              {p.denyBranchOnlyNotice}
            </div>
          )}
        </div>
        <div className="max-h-[70vh] flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-4 [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225/0.8)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-track]:bg-transparent">
          {permissions.length === 0 && (
            <p className="mt-10 text-center text-sm text-gray-500">{p.noneFound}</p>
          )}
          {permissions.map((perm: { id: string; name: string; description?: string; has_access?: boolean }) => (
            <div
              key={perm.id}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-all"
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="text-sm font-bold text-gray-800">{perm.name}</h3>
                {!perm.has_access && <Lock size={14} className="text-rose-400" />}
                {perm.has_access && <ShieldCheck size={14} className="text-emerald-500" />}
              </div>
              <p className="line-clamp-2 text-xs text-gray-500">{perm.description || p.defaultDescription}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal removed as per read-only request */}
    </div>
  );
}

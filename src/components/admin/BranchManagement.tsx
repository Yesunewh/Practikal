import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetUnitTreeQuery,
  useCreateUnitMutation,
  useGetUnitTypesQuery,
  useGetOrganizationsQuery,
} from '../../store/apiSlice/practikalApi';
import { GitFork, Plus, ChevronRight, ChevronDown, MapPin, UserPlus } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';
import AdminHierarchyPageShell from './AdminHierarchyPageShell';
import HierarchyLevelsGraphic from './HierarchyLevelsGraphic';
import BranchHierarchyDiagram from './BranchHierarchyDiagram';

export default function BranchManagement({ currentUser }: { currentUser: User }) {
  const navigate = useNavigate();
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isOrgAdminUser = currentUser.user_type === 'ORG_ADMIN';
  const isUnitAdminUser = currentUser.user_type === 'UNIT_ADMIN';
  const assignedUnitId = typeof currentUser.unitId === 'string' ? currentUser.unitId : undefined;
  const orgIdFromUser = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;

  /** Tenant org structure is owned by org/unit admins. Superadmin may browse any org but cannot create units for tenants. */
  const canMutateHierarchy = !isSuperAdmin;
  const canAddRootLocation = isOrgAdminUser;
  const canAddChildUnderNode = (nodeId: string) => {
    if (!canMutateHierarchy) return false;
    if (isOrgAdminUser) return false;
    if (isUnitAdminUser && assignedUnitId && nodeId === assignedUnitId) return true;
    return false;
  };
  const canInviteUnitAdminFromTree = isOrgAdminUser;

  const { data: orgsData } = useGetOrganizationsQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const orgs = (orgsData?.orgs ?? []) as { id: string; name: string }[];

  const [superOrgId, setSuperOrgId] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) {
      setSuperOrgId('');
      return;
    }
    if (orgIdFromUser && !superOrgId) {
      setSuperOrgId(orgIdFromUser);
    }
  }, [isSuperAdmin, orgIdFromUser, superOrgId]);

  const effectiveOrgId = isSuperAdmin ? superOrgId || orgIdFromUser || '' : orgIdFromUser || '';

  const { data: treeRes, isLoading: loadingTree, refetch: refetchTree } = useGetUnitTreeQuery(
    effectiveOrgId,
    { skip: !effectiveOrgId }
  );
  const { data: typesRes, isLoading: loadingTypes } = useGetUnitTypesQuery(effectiveOrgId, {
    skip: !effectiveOrgId,
  });
  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [addingToParent, setAddingToParent] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');

  if (!effectiveOrgId) {
    return (
      <AdminHierarchyPageShell
        title="Structural hierarchy"
        subtitle="Select an organization to view and edit its branch tree. Top-level units branch into sub-locations matching your terminology levels."
      >
        <div className="p-6">
          {isSuperAdmin ? (
            <>
              <label className="mb-1 block text-xs font-medium text-indigo-900/80">Organization</label>
              <select
                className="w-full max-w-xl rounded-xl border border-indigo-200/90 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={superOrgId}
                onChange={(e) => setSuperOrgId(e.target.value)}
              >
                <option value="">Select organization…</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Your account is not linked to an organization. Contact a platform administrator.
            </p>
          )}
        </div>
      </AdminHierarchyPageShell>
    );
  }

  if (loadingTree || loadingTypes) {
    return (
      <div className="animate-pulse rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 text-center text-sm text-indigo-800/80">
        Loading hierarchy…
      </div>
    );
  }

  const unitTypes = (typesRes?.data || []).slice().sort((a: any, b: any) => a.level - b.level);
  const rootUnits = treeRes?.data || [];

  const getTypeLabel = (typeId: string) =>
    String(unitTypes.find((t: any) => t.id === typeId)?.name ?? 'Unit');

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (parentId: string | null, targetTypeId: string) => {
    const name = newUnitName.trim();
    if (!name) return;
    if (isSuperAdmin) {
      toast.error('Superadmin view is read-only. Organization or unit admins create and edit branch locations.');
      return;
    }
    try {
      const body: { name: string; type_id: string; parent_id: string | null; org_id?: string } = {
        name,
        type_id: targetTypeId,
        parent_id: parentId,
      };
      await createUnit(body).unwrap();

      setNewUnitName('');
      setAddingToParent(null);
      if (parentId) {
        setExpandedNodes((prev) => new Set(prev).add(parentId));
      }
      await refetchTree();
      toast.success('Location saved.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Failed to create branch');
    }
  };

  const getNextType = (currentLevel: number) => {
    return unitTypes.find((t: any) => t.level === currentLevel + 1);
  };

  const renderTree = (nodes: any[], currentLevel: number) => {
    if (!nodes || nodes.length === 0) return null;

    const nextType = getNextType(currentLevel);

    return (
      <ul className="relative ml-0 mt-1 space-y-2.5 border-l-[3px] border-indigo-300/90 pl-7 sm:space-y-3 sm:pl-9">
        {nodes.map((node) => {
          const isExpanded = expandedNodes.has(node.id);
          const childList = node.SubUnits || node.children || [];
          const hasChildren = childList.length > 0;
          const isAddingHere = addingToParent === node.id;
          const targetLevelType = unitTypes.find((t: any) => t.id === node.type_id);
          const allowChildHere = nextType && canAddChildUnderNode(node.id);

          return (
            <li key={node.id} className="relative">
              <div className="flex items-center gap-2 py-1.5 group">
                <button
                  type="button"
                  onClick={() => toggleNode(node.id)}
                  className="flex-shrink-0 rounded p-0.5 text-indigo-600/70 transition-colors hover:bg-indigo-100/80"
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )
                  ) : (
                    <span className="w-[18px] inline-block" />
                  )}
                </button>

                <div className="group flex max-w-md flex-1 items-center gap-2 rounded-xl border border-indigo-100/90 bg-white px-3 py-2 shadow-md shadow-indigo-950/[0.04] ring-1 ring-indigo-950/[0.03] transition-colors hover:border-indigo-300/90">
                  <MapPin size={16} className="shrink-0 text-indigo-500" />
                  <span className="font-medium text-neutral-800">{node.name}</span>
                  <span className="ml-auto rounded-full border border-violet-200/80 bg-violet-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-800/80">
                    {targetLevelType?.name || 'Unknown'}
                  </span>
                </div>

                {allowChildHere && !isAddingHere && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingToParent(node.id);
                      setNewUnitName('');
                    }}
                    className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 opacity-0 transition-opacity hover:bg-indigo-100 hover:text-indigo-900 group-hover:opacity-100"
                  >
                    <Plus size={14} /> Add {nextType.name}
                  </button>
                )}
                {canInviteUnitAdminFromTree && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/admin/users', {
                        state: { prefillUnitAdmin: { unitId: node.id, orgId: effectiveOrgId } },
                      })
                    }
                    className="flex items-center gap-1 rounded-md border border-violet-200/90 bg-violet-50/90 px-2.5 py-1.5 text-xs font-medium text-violet-900 opacity-0 transition-opacity hover:bg-violet-100 group-hover:opacity-100"
                    title="Open Active Roster to add a branch admin for this location"
                  >
                    <UserPlus size={14} /> Add unit admin
                  </button>
                )}
              </div>

              {isAddingHere && nextType && allowChildHere && (
                <div className="pl-8 mt-2 mb-3 animate-in slide-in-from-top-2">
                  <div className="flex max-w-sm items-center gap-2 rounded-xl border border-indigo-200/90 bg-indigo-50/90 p-2 shadow-sm">
                    <input
                      autoFocus
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      placeholder={`New ${nextType.name} name`}
                      className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleCreate(node.id, nextType.id);
                        if (e.key === 'Escape') setAddingToParent(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreate(node.id, nextType.id)}
                      disabled={isCreating || !newUnitName.trim()}
                      className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingToParent(null)}
                      className="px-2 text-sm font-medium text-neutral-500 hover:text-neutral-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isExpanded && renderTree(node.SubUnits || node.children || [], currentLevel + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  const level1Type = unitTypes.find((t: any) => t.level === 1);

  if (unitTypes.length === 0) {
    return (
      <AdminHierarchyPageShell
        title="Structural hierarchy"
        subtitle="Define how your organization names each level of the branch tree, then build locations here."
      >
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-200/80 bg-indigo-50/80">
            <GitFork size={32} className="text-indigo-400" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-indigo-950">No structural terminology defined</h3>
          <p className="mx-auto max-w-md text-sm text-indigo-900/65">
            Open <strong className="text-indigo-900">Terminology</strong> first and define your levels (e.g. Region, City,
            Branch), then return here to add locations.
          </p>
        </div>
      </AdminHierarchyPageShell>
    );
  }

  return (
    <AdminHierarchyPageShell title="Structural hierarchy">
      {isSuperAdmin && (
        <div className="border-b border-indigo-100/70 bg-white/50 px-4 py-4 sm:px-6">
          <div className="sm:flex sm:justify-end">
            <div className="w-full min-w-0 sm:max-w-xs">
              <label className="mb-1 block text-xs font-medium text-indigo-900/80">Organization</label>
              <select
                className="w-full rounded-xl border border-indigo-200/90 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={superOrgId}
                onChange={(e) => setSuperOrgId(e.target.value)}
              >
                <option value="">Select organization…</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-indigo-100/70 bg-gradient-to-r from-violet-50/60 via-white to-indigo-50/45 px-4 py-4 sm:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-800/55">
          Branch depth — terminology levels
        </p>
        <HierarchyLevelsGraphic
          levels={unitTypes.map((t: any) => ({
            id: String(t.id),
            level: Number(t.level),
            name: String(t.name ?? ''),
          }))}
        />
      </div>

      {rootUnits.length > 0 && (
        <div className="border-b border-indigo-100/70 px-4 py-4 sm:px-6">
          <BranchHierarchyDiagram roots={rootUnits} getTypeLabel={getTypeLabel} />
        </div>
      )}

      <div className="overflow-x-auto p-4 sm:p-6">
        {rootUnits.length === 0 ? (
          addingToParent === null ? (
            <div className="group rounded-2xl border-2 border-dashed border-indigo-200/80 bg-gradient-to-b from-indigo-50/60 to-violet-50/40 py-16 text-center transition-all hover:border-indigo-300 hover:from-indigo-50 hover:to-violet-50/60">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-100 bg-white shadow-sm transition-transform group-hover:scale-[1.02]">
                <MapPin size={32} className="text-indigo-400 group-hover:text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-indigo-950">Your network is empty</h3>
              <p className="mx-auto mt-2 mb-8 max-w-sm text-sm text-indigo-900/65">
                {isSuperAdmin
                  ? 'No locations yet for this organization. The tenant’s organization admin adds the first top-level location from their admin account.'
                  : 'Add the first top-level location (e.g. region or head office). Sub-locations nest under it.'}
              </p>
              {level1Type && canAddRootLocation && (
                <button
                  type="button"
                  onClick={() => setAddingToParent('root')}
                  className="mx-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  <Plus size={20} />
                  Add first {level1Type.name}
                </button>
              )}
              {level1Type && !canAddRootLocation && (
                <p className="mx-auto max-w-md text-sm text-indigo-900/70">
                  {isSuperAdmin
                    ? 'Superadmin cannot create tenant branches. Switch to an organization admin (or unit admin) account to add locations.'
                    : 'Top-level locations are created by your organization administrator. You can add sub-locations under your assigned branch when it appears in this list.'}
                </p>
              )}
            </div>
          ) : null
        ) : (
          <div className="relative">
            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 to-violet-50/25 py-5 pr-4 shadow-inner shadow-indigo-100/40 sm:pr-6">
              {renderTree(rootUnits, 1)}
            </div>

            {level1Type && addingToParent !== 'root' && canAddRootLocation && (
              <button
                type="button"
                onClick={() => {
                  setAddingToParent('root');
                  setNewUnitName('');
                }}
                className="mt-6 flex items-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-900"
              >
                <Plus size={16} /> Add another {level1Type.name}
              </button>
            )}

            {addingToParent === 'root' && level1Type && canAddRootLocation && (
              <div className="animate-in slide-in-from-bottom-2 mt-4 flex max-w-sm items-center gap-2 rounded-xl border border-indigo-200/90 bg-indigo-50/90 p-2.5 shadow-md">
                <input
                  autoFocus
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder={`New ${level1Type.name} name`}
                  className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreate(null, level1Type.id);
                    if (e.key === 'Escape') setAddingToParent(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleCreate(null, level1Type.id)}
                  disabled={isCreating || !newUnitName.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setAddingToParent(null)}
                  className="px-2 text-sm font-medium text-neutral-500 hover:text-neutral-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {rootUnits.length === 0 && addingToParent === 'root' && level1Type && canAddRootLocation && (
          <div className="mt-6 flex max-w-sm items-center gap-2 rounded-xl border border-indigo-200/90 bg-indigo-50/90 p-2.5 shadow-md">
            <input
              autoFocus
              type="text"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder={`New ${level1Type.name} name`}
              className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate(null, level1Type.id);
                if (e.key === 'Escape') setAddingToParent(null);
              }}
            />
            <button
              type="button"
              onClick={() => void handleCreate(null, level1Type.id)}
              disabled={isCreating || !newUnitName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setAddingToParent(null)}
              className="px-2 text-sm font-medium text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </AdminHierarchyPageShell>
  );
}

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

export default function BranchManagement({ currentUser }: { currentUser: User }) {
  const navigate = useNavigate();
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isOrgAdminUser = currentUser.user_type === 'ORG_ADMIN';
  const isUnitAdminUser = currentUser.user_type === 'UNIT_ADMIN';
  const assignedUnitId = typeof currentUser.unitId === 'string' ? currentUser.unitId : undefined;
  const orgIdFromUser = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;

  /** Org admins create top-level (level 1) nodes only; unit admins add one level under their branch; superadmin can do both. */
  const canAddRootLocation = isSuperAdmin || isOrgAdminUser;
  const canAddChildUnderNode = (nodeId: string) => {
    if (isSuperAdmin) return true;
    if (isOrgAdminUser) return false;
    if (isUnitAdminUser && assignedUnitId && nodeId === assignedUnitId) return true;
    return false;
  };
  const canInviteUnitAdminFromTree = isSuperAdmin || isOrgAdminUser;

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
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 max-w-xl">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <GitFork className="text-emerald-600" />
          Structural Hierarchy
        </h2>
        {isSuperAdmin ? (
          <>
            <p className="text-sm text-gray-600 mb-4">Select an organization to view and edit its branch tree.</p>
            <label className="block text-xs font-medium text-gray-700 mb-1">Organization</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Your account is not linked to an organization. Contact a platform administrator.
          </p>
        )}
      </div>
    );
  }

  if (loadingTree || loadingTypes) {
    return <div className="p-6 text-gray-500 animate-pulse">Loading hierarchy…</div>;
  }

  const unitTypes = (typesRes?.data || []).slice().sort((a: any, b: any) => a.level - b.level);
  const rootUnits = treeRes?.data || [];

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
    try {
      const body: { name: string; type_id: string; parent_id: string | null; org_id?: string } = {
        name,
        type_id: targetTypeId,
        parent_id: parentId,
      };
      if (isSuperAdmin) {
        body.org_id = effectiveOrgId;
      }
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
      <ul className="pl-6 space-y-2 mt-2 border-l-2 border-gray-100 ml-3">
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
                  className="p-0.5 hover:bg-gray-200 rounded text-gray-500 flex-shrink-0 transition-colors"
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

                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex-1 max-w-md hover:border-emerald-300 transition-colors group">
                  <MapPin size={16} className="text-emerald-500" />
                  <span className="font-medium text-gray-800">{node.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 ml-auto bg-gray-50 px-2 py-0.5 rounded-full border">
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium flex items-center gap-1 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md"
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium flex items-center gap-1 text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200/80"
                    title="Open Active Roster to add a branch admin for this location"
                  >
                    <UserPlus size={14} /> Add unit admin
                  </button>
                )}
              </div>

              {isAddingHere && nextType && allowChildHere && (
                <div className="pl-8 mt-2 mb-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 max-w-sm bg-emerald-50 p-2 rounded-lg border border-emerald-200 shadow-sm">
                    <input
                      autoFocus
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      placeholder={`New ${nextType.name} name`}
                      className="flex-1 text-sm rounded border-gray-300 px-3 py-1.5 focus:ring-emerald-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleCreate(node.id, nextType.id);
                        if (e.key === 'Escape') setAddingToParent(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreate(node.id, nextType.id)}
                      disabled={isCreating || !newUnitName.trim()}
                      className="bg-emerald-600 text-white px-4 py-1.5 text-sm font-medium rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingToParent(null)}
                      className="text-gray-500 hover:text-gray-700 px-2 text-sm font-medium"
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
      <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
          <GitFork size={32} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">No structural terminology defined</h2>
        <p className="text-gray-500">
          Open <strong>Terminology</strong> first and define your levels (e.g. Region, City, Branch), then return here to
          add locations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm min-h-[500px]">
      <div className="p-6 border-b flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <GitFork className="text-emerald-600" />
            Structural Hierarchy
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Map branches for your organization. Names follow the levels you set under Terminology. Organization admins add
            top-level locations only; each location can have a unit admin who adds the next level beneath that branch.
          </p>
        </div>
        {isSuperAdmin && (
          <div className="min-w-[220px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Organization</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
        )}
      </div>

      <div className="p-6 overflow-x-auto">
        {rootUnits.length === 0 ? (
          addingToParent === null ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 group">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
                <MapPin size={32} className="text-gray-300 group-hover:text-emerald-400" />
              </div>
              <h3 className="text-gray-800 font-bold text-xl">Your network is empty</h3>
              <p className="text-gray-500 text-sm mt-2 mb-8 max-w-sm mx-auto">
                Add the first top-level location (e.g. region or head office). Sub-locations nest under it.
              </p>
              {level1Type && canAddRootLocation && (
                <button
                  type="button"
                  onClick={() => setAddingToParent('root')}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
                >
                  <Plus size={20} />
                  Add first {level1Type.name}
                </button>
              )}
              {level1Type && !canAddRootLocation && (
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Top-level locations are created by your organization administrator. You can add sub-locations under your
                  assigned branch when it appears in this list.
                </p>
              )}
            </div>
          ) : null
        ) : (
          <div className="relative">
            <div className="bg-gray-50 border border-gray-100 rounded-xl py-4 pr-6">
              {renderTree(rootUnits, 1)}
            </div>

            {level1Type && addingToParent !== 'root' && canAddRootLocation && (
              <button
                type="button"
                onClick={() => {
                  setAddingToParent('root');
                  setNewUnitName('');
                }}
                className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
              >
                <Plus size={16} /> Add another {level1Type.name}
              </button>
            )}

            {addingToParent === 'root' && level1Type && canAddRootLocation && (
              <div className="mt-4 flex items-center gap-2 max-w-sm bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 shadow-md animate-in slide-in-from-bottom-2">
                <input
                  autoFocus
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder={`New ${level1Type.name} name`}
                  className="flex-1 text-sm rounded-md border-gray-300 px-3 py-2 focus:ring-emerald-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreate(null, level1Type.id);
                    if (e.key === 'Escape') setAddingToParent(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleCreate(null, level1Type.id)}
                  disabled={isCreating || !newUnitName.trim()}
                  className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setAddingToParent(null)}
                  className="text-gray-500 hover:text-gray-800 font-medium px-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {rootUnits.length === 0 && addingToParent === 'root' && level1Type && canAddRootLocation && (
          <div className="mt-6 flex items-center gap-2 max-w-sm bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 shadow-md">
            <input
              autoFocus
              type="text"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder={`New ${level1Type.name} name`}
              className="flex-1 text-sm rounded-md border-gray-300 px-3 py-2 focus:ring-emerald-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate(null, level1Type.id);
                if (e.key === 'Escape') setAddingToParent(null);
              }}
            />
            <button
              type="button"
              onClick={() => void handleCreate(null, level1Type.id)}
              disabled={isCreating || !newUnitName.trim()}
              className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setAddingToParent(null)}
              className="text-gray-500 hover:text-gray-800 font-medium px-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

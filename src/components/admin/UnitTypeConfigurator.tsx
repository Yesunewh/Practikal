import { useState, useEffect } from 'react';
import {
  useGetUnitTypesQuery,
  useCreateUnitTypeMutation,
  useGetOrganizationsQuery,
} from '../../store/apiSlice/practikalApi';
import { Plus, Save } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';
import AdminHierarchyPageShell from './AdminHierarchyPageShell';
import HierarchyLevelsGraphic from './HierarchyLevelsGraphic';

export default function UnitTypeConfigurator({ currentUser }: { currentUser: User }) {
  const isSuperAdmin = currentUser.role === 'superadmin';
  const orgIdFromUser = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;

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

  const { data: unitTypesRes, isLoading, refetch } = useGetUnitTypesQuery(effectiveOrgId, {
    skip: !effectiveOrgId,
  });
  const [createType, { isLoading: isCreating }] = useCreateUnitTypeMutation();

  const [name, setName] = useState('');

  const unitTypes = (unitTypesRes?.data || []).slice().sort((a: any, b: any) => a.level - b.level);
  const nextLevel = unitTypes.length > 0 ? unitTypes[unitTypes.length - 1].level + 1 : 1;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOrgId) {
      toast.error('Select an organization first.');
      return;
    }
    if (nextLevel > 5) {
      toast.error('Maximum of 5 hierarchy levels supported.');
      return;
    }
    try {
      const body: { name: string; level: number; org_id?: string } = {
        name: name.trim(),
        level: nextLevel,
      };
      if (isSuperAdmin) {
        body.org_id = effectiveOrgId;
      }
      await createType(body).unwrap();
      setName('');
      await refetch();
      toast.success('Level saved.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Failed to create unit type');
    }
  };

  if (!effectiveOrgId && !isLoading) {
    return (
      <AdminHierarchyPageShell
        title="Structural terminology"
        subtitle="Choose which organization’s hierarchy labels to edit. Labels appear in the branch tree and across admin tools."
      >
        <div className="space-y-4 p-6">
          {isSuperAdmin ? (
            <>
              <label className="block text-xs font-medium text-indigo-900/80">Organization</label>
              <select
                className="w-full max-w-md rounded-xl border border-indigo-200/90 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
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

  if (isLoading) {
    return (
      <AdminHierarchyPageShell
        title="Structural terminology"
        subtitle="Loading your organization’s hierarchy labels…"
      >
        <div className="px-6 py-12 text-center text-sm text-indigo-800/75">Loading configuration…</div>
      </AdminHierarchyPageShell>
    );
  }

  return (
    <AdminHierarchyPageShell
      title="Structural terminology"
      subtitle="Define vocabulary for your organization’s branch hierarchy (e.g. Region, Zone, Woreda, Branch)."
    >
      <div className="border-b border-indigo-100/60 bg-white/50 px-4 py-4 sm:px-6">
        {isSuperAdmin && (
          <div className="max-w-md">
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
        )}
      </div>

      {unitTypes.length > 0 && (
        <div className="border-b border-indigo-100/70 bg-gradient-to-r from-violet-50/60 via-white to-indigo-50/45 px-4 py-4 sm:px-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-800/55">
            Level ladder — saved terminology
          </p>
          <HierarchyLevelsGraphic
            levels={unitTypes.map((t: any) => ({
              id: String(t.id),
              level: Number(t.level),
              name: String(t.name ?? ''),
            }))}
          />
        </div>
      )}

      <div className="p-4 sm:p-6">
        <div className="mb-6 space-y-3 sm:mb-8">
          {unitTypes.map((type: any) => (
            <div
              key={type.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/90 bg-white/90 p-4 shadow-md shadow-indigo-950/[0.04] ring-1 ring-indigo-950/[0.03] sm:gap-4"
            >
              <div className="min-w-[5.5rem] rounded-lg border border-violet-200 bg-gradient-to-br from-violet-100 to-indigo-100 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wider text-indigo-900">
                Level {type.level}
              </div>
              <div className="text-lg font-medium text-neutral-800">{type.name}</div>
            </div>
          ))}
          {unitTypes.length === 0 && (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950">
              No hierarchy defined yet. Create Level 1 (e.g. Region or Head Office).
            </div>
          )}
        </div>

        {nextLevel <= 5 ? (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-violet-50/60 p-5 shadow-inner"
          >
            <h3 className="mb-4 flex items-center gap-2 font-medium text-indigo-950">
              <Plus className="text-indigo-600" size={18} aria-hidden />
              Define level {nextLevel} nomenclature
            </h3>
            <div className="flex flex-wrap gap-3">
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-[200px] flex-1 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                placeholder={`e.g. ${nextLevel === 1 ? 'Region' : nextLevel === 2 ? 'Zone' : 'Office'}`}
              />
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  'Saving…'
                ) : (
                  <>
                    <Save size={18} aria-hidden /> Save level
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-neutral-100/80 p-4 text-center text-sm text-neutral-600">
            Maximum depth of 5 levels reached.
          </div>
        )}
      </div>
    </AdminHierarchyPageShell>
  );
}

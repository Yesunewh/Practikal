import { useState, useEffect } from 'react';
import {
  useGetUnitTypesQuery,
  useCreateUnitTypeMutation,
  useGetOrganizationsQuery,
} from '../../store/apiSlice/practikalApi';
import { Layers, Plus, Save } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';

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
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-emerald-600" />
          Structural Terminology
        </h2>
        {isSuperAdmin ? (
          <>
            <p className="text-sm text-gray-600">Choose which organization’s hierarchy labels to edit.</p>
            <label className="block text-xs font-medium text-gray-700">Organization</label>
            <select
              className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm"
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

  if (isLoading) return <div className="p-6 text-gray-500">Loading configuration…</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-emerald-600" />
          Structural Terminology
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Define vocabulary for your organization’s branch hierarchy (e.g. Region, Zone, Woreda, Branch).
        </p>
        {isSuperAdmin && (
          <div className="mt-4 max-w-md">
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

      <div className="p-6">
        <div className="mb-8 space-y-3">
          {unitTypes.map((type: any) => (
            <div
              key={type.id}
              className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded text-sm min-w-[80px] text-center uppercase tracking-wider">
                Level {type.level}
              </div>
              <div className="font-medium text-gray-800 text-lg">{type.name}</div>
            </div>
          ))}
          {unitTypes.length === 0 && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
              No hierarchy defined yet. Create Level 1 (e.g. Region or Head Office).
            </div>
          )}
        </div>

        {nextLevel <= 5 ? (
          <form onSubmit={handleCreate} className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
            <h3 className="font-medium text-emerald-900 mb-4 flex items-center gap-2">
              <Plus size={18} />
              Define Level {nextLevel} nomenclature
            </h3>
            <div className="flex gap-3 flex-wrap">
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 min-w-[200px] rounded-lg border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 bg-white"
                placeholder={`e.g. ${nextLevel === 1 ? 'Region' : nextLevel === 2 ? 'Zone' : 'Office'}`}
              />
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isCreating ? 'Saving…' : (
                  <>
                    <Save size={18} /> Save level
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-sm text-center">
            Maximum depth of 5 levels reached.
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  useGetUnitTypesQuery,
  useCreateUnitTypeMutation,
  useUpdateUnitTypeMutation,
  useGetOrganizationsQuery,
} from '../../store/apiSlice/practikalApi';
import { Plus, Save, Edit2, X, Info } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';
import AdminHierarchyPageShell from './AdminHierarchyPageShell';
import HierarchyLevelsGraphic from './HierarchyLevelsGraphic';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';

export default function UnitTypeConfigurator({ currentUser }: { currentUser: User }) {
  const { messages } = useI18n();
  const t = messages.admin.terminology;
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
  const [updateType, { isLoading: isUpdating }] = useUpdateUnitTypeMutation();

  const [name, setName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  // Body scroll lock
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const unitTypes = (unitTypesRes?.data || []).slice().sort((a: any, b: any) => a.level - b.level);
  const nextLevel = unitTypes.length > 0 ? unitTypes[unitTypes.length - 1].level + 1 : 1;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOrgId) {
      toast.error(t.toastSelectOrgFirst);
      return;
    }

    try {
      if (editingType) {
        await updateType({
          id: editingType.id,
          name: name.trim(),
          org_id: isSuperAdmin ? effectiveOrgId : undefined,
        }).unwrap();
        toast.success('Level updated.');
      } else {
        if (nextLevel > 5) {
          toast.error(t.toastMaxLevels);
          return;
        }
        const body: { name: string; level: number; org_id?: string } = {
          name: name.trim(),
          level: nextLevel,
        };
        if (isSuperAdmin) {
          body.org_id = effectiveOrgId;
        }
        await createType(body).unwrap();
        toast.success(t.toastLevelSaved);
      }

      setName('');
      setEditingType(null);
      setIsModalOpen(false);
      await refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || (editingType ? 'Failed to update' : t.toastCreateFailed));
    }
  };

  const openCreateModal = () => {
    if (nextLevel > 5) {
      toast.error(t.toastMaxLevels);
      return;
    }
    setEditingType(null);
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (type: any) => {
    setEditingType(type);
    setName(type.name);
    setIsModalOpen(true);
  };

  if (!effectiveOrgId && !isLoading) {
    return (
      <AdminHierarchyPageShell title={t.shellTitle} subtitle={t.shellSubtitleChooseOrg}>
        <div className="p-1">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 max-w-2xl mx-auto text-center">
            {isSuperAdmin ? (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <Plus size={32} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">{t.orgLabel}</h3>
                  <p className="text-sm text-neutral-500 mb-6">{t.selectOrgPlaceholder}</p>
                  <select
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    value={superOrgId}
                    onChange={(e) => setSuperOrgId(e.target.value)}
                  >
                    <option value="">{t.selectOrgPlaceholder}</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <Plus size={32} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{t.accountNotLinked}</h3>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                  Please contact a system administrator to link your account to an organization.
                </p>
              </div>
            )}
          </div>
        </div>
      </AdminHierarchyPageShell>
    );
  }

  return (
    <AdminHierarchyPageShell title={t.shellTitle}>
      {isLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600/20 border-t-emerald-600"></div>
        </div>
      )}

      <div className="bg-white border-b border-neutral-200 p-1">
        {isSuperAdmin && (
          <div className="max-w-md">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">{t.orgLabel}</label>
            <select
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-1 text-sm text-neutral-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              value={superOrgId}
              onChange={(e) => setSuperOrgId(e.target.value)}
            >
              <option value="">{t.selectOrgPlaceholder}</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-1">
        <div className="mb-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            {t.levelLadderCaption}
          </h4>
        </div>

        {unitTypes.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-xl shadow-emerald-500/5 mb-2">
            <HierarchyLevelsGraphic
              levels={unitTypes.map((t: any) => ({
                id: String(t.id),
                level: Number(t.level),
                name: String(t.name ?? ''),
              }))}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-2">
          {unitTypes.map((type: any) => (
            <div
              key={type.id}
              className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-neutral-100 bg-white p-6 transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-700 shadow-sm transition-transform group-hover:scale-110">
                L{type.level}
              </div>
              <div className="text-center font-black text-lg text-neutral-900 mb-4">{type.name}</div>

              <button
                onClick={() => openEditModal(type)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-50 px-3 py-1.5 text-[10px] font-black text-neutral-500 uppercase tracking-wider transition-all hover:bg-emerald-600 hover:text-white active:scale-95"
              >
                <Edit2 size={12} /> Edit
              </button>
            </div>
          ))}

          {nextLevel <= 5 && (
            <button
              onClick={openCreateModal}
              className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-6 transition-all hover:border-emerald-500 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 active:scale-95"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white border-2 border-dashed border-neutral-200 text-neutral-400 shadow-sm transition-colors group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <div className="font-black text-lg text-neutral-400 group-hover:text-emerald-900 transition-colors">Add L{nextLevel}</div>
              </div>
            </button>
          )}
        </div>

        {nextLevel > 5 && (
          <div className="max-w-md mx-auto rounded-2xl border border-neutral-200 bg-neutral-100/50 p-6 text-center">
            <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-500">
              <Plus size={24} className="rotate-45" />
            </div>
            <p className="text-sm font-bold text-neutral-600">{t.maxDepthReached}</p>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-2xl w-full max-w-sm h-auto max-h-[min(400px,90vh)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-neutral-50/50 border-b border-neutral-100 p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-base font-black shadow-lg shadow-emerald-600/20">
                  L{editingType ? editingType.level : nextLevel}
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 leading-tight">
                    {editingType ? `Edit Level ${editingType.level}` : `Define level ${nextLevel}`}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Nomenclature</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">
                    Level Name
                  </label>
                  <input
                    required
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border-2 border-neutral-50 bg-neutral-50/30 px-4 py-3 text-base font-bold text-neutral-800 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    placeholder={
                      (editingType ? editingType.level : nextLevel) === 1 ? t.placeholderL1 : (editingType ? editingType.level : nextLevel) === 2 ? t.placeholderL2 : "e.g. Office"
                    }
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl border border-neutral-100 px-4 py-3 text-xs font-black text-neutral-500 hover:bg-neutral-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating || !name.trim()}
                    className="flex-[1.5] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    {(isCreating || isUpdating) ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={16} /> Save level
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminHierarchyPageShell>
  );
}

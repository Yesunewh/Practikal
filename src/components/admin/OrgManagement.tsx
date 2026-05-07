import {
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useAdminCreateUserMutation,
  useAllocatePermissionMutation,
  useBulkAllocatePermissionsMutation,
  useGetAvailablePermissionsQuery,
  useGetUsersQuery,
  useResetUserPasswordMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetDepartmentsQuery,
  useGetUnitTreeQuery,
} from '../../store/apiSlice/practikalApi';
import {
  Building2,
  Plus,
  Search,
  X,
  ShieldAlert,
  Loader2,
  UserPlus,
  ArrowRight,
  Users,
  Key,
  Power,
  Smartphone,
  Layout,
  Layers,
  ShieldCheck,
  Network,
  RefreshCw,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate, type Messages } from '../../i18n/messages';
import { useNavigate } from 'react-router-dom';

function rtkErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const o = err as Record<string, unknown>;
  if (o.data && typeof o.data === 'object') {
    const m = (o.data as Record<string, unknown>).message;
    if (typeof m === 'string' && m) return m;
  }
  if (typeof o.message === 'string' && o.message) return o.message;
  return '';
}

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  status?: string;
  subscription_plan?: string | null;
  createdAt?: string;
}

interface ApiUser {
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  email?: string;
  status?: string;
  org_id?: string | null;
  user_type?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OrgManagement() {
  const { messages } = useI18n();
  const o = messages.admin.organizations;
  const oc = o.console;
  const { data, isLoading, isFetching, isError, refetch } = useGetOrganizationsQuery(undefined);
  const [createOrg, { isLoading: isCreating }] = useCreateOrganizationMutation();
  const [createAdmin, { isLoading: isCreatingAdmin }] = useAdminCreateUserMutation();
  const [allocatePermission, { isLoading: isAllocating }] = useAllocatePermissionMutation();
  const [bulkAllocate, { isLoading: isBulking }] = useBulkAllocatePermissionsMutation();
  const { data: allUsersData, refetch: refetchAllUsers } = useGetUsersQuery(undefined);

  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationRow | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [slugTouched, setSlugTouched] = useState(false);

  const [adminFormData, setAdminFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: 'Password123',
    user_type: 'ORG_ADMIN',
    org_id: '',
    status: 'ACTIVE',
  });

  const orgs = (data?.orgs ?? []) as OrganizationRow[];

  const membersByOrgId = useMemo(() => {
    const map = new Map<string, number>();
    const users = (allUsersData?.users ?? []) as ApiUser[];
    for (const u of users) {
      if (!u.org_id) continue;
      map.set(u.org_id, (map.get(u.org_id) ?? 0) + 1);
    }
    return map;
  }, [allUsersData?.users]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrg({ name: formData.name.trim(), slug: formData.slug.trim() }).unwrap();
      setIsModalOpen(false);
      setFormData({ name: '', slug: '' });
      setSlugTouched(false);
      refetch();
      toast.success(o.toastOrgCreated);
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastOrgCreateError);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await createAdmin({ ...adminFormData, org_id: selectedOrg.id }).unwrap();
      void refetchAllUsers();
      setIsAdminModalOpen(false);
      setAdminFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        password: 'Password123',
        user_type: 'ORG_ADMIN',
        org_id: '',
        status: 'ACTIVE',
      });
      toast.success(o.toastAdminCreated);
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastAdminCreateError);
    }
  };

  const handleTogglePermission = async (permId: string) => {
    if (!selectedOrg) return;
    try {
      await allocatePermission({
        permissionId: permId,
        type: 'ORGANIZATION',
        targetId: selectedOrg.id,
        effect: 'GRANT',
      }).unwrap();
      toast.success(o.toastPermUpdated);
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastPermUpdateError);
    }
  };

  const handleGrantFullSuite = async () => {
    if (!selectedOrg) return;
    if (!confirm(o.confirmGrantAll)) return;
    try {
      await bulkAllocate({ orgId: selectedOrg.id, effect: 'GRANT' }).unwrap();
      toast.success(o.toastAllGranted);
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastBulkGrantFailed);
    }
  };

  const filteredOrgs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return orgs;
    return orgs.filter((org) => org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q));
  }, [orgs, searchQuery]);

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{o.headerTitle}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {o.refresh}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', slug: '' });
              setSlugTouched(false);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm"
          >
            <Plus size={18} />
            {o.newOrganization}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder={o.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className="text-sm text-gray-500">
          {interpolate(o.countOfTotal, { shown: filteredOrgs.length, total: orgs.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading && orgs.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
            <p className="text-sm font-medium">{o.loadingList}</p>
          </div>
        ) : isError ? (
          <div className="col-span-full py-16 px-6 rounded-xl border border-red-200 bg-red-50 text-center">
            <ShieldAlert className="mx-auto text-red-500 mb-3" size={40} />
            <p className="font-medium text-red-900">{o.loadErrorTitle}</p>
            <p className="text-sm text-red-800 mt-1">{o.loadErrorHint}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-800 hover:bg-red-100/50"
            >
              {o.tryAgain}
            </button>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="col-span-full py-16 px-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
            <Building2 className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="font-medium text-gray-900">
              {orgs.length === 0 ? o.emptyStateNoOrgsTitle : o.emptyStateNoMatchTitle}
            </p>
            <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
              {orgs.length === 0 ? o.emptyStateNoOrgsBody : o.emptyStateNoMatchBody}
            </p>
            {orgs.length === 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                <Plus size={18} />
                {o.newOrganization}
              </button>
            )}
          </div>
        ) : (
          filteredOrgs.map((org) => {
            const members = membersByOrgId.get(org.id) ?? 0;
            const active = (org.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
            return (
              <article
                key={org.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200/80 transition-all flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <Building2 size={22} />
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                        active ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {org.status ?? 'ACTIVE'}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 leading-snug">{org.name}</h3>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">/{org.slug}</p>
                  {org.subscription_plan && (
                    <p className="text-xs text-gray-600 mt-2">
                      {o.planLabel} <span className="font-medium capitalize">{org.subscription_plan}</span>
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="text-gray-400" />
                    <span>
                      <span className="font-medium text-gray-900">{members}</span>{' '}
                      {members === 1 ? o.membersOne : interpolate(o.membersMany, { n: members })}
                    </span>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/organizations/${org.slug}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700"
                  >
                    {o.manage}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrg(org);
                      setIsAdminModalOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-800 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    <UserPlus size={16} />
                    {o.addAdmin}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <ModalShell
          title={o.modalNewTitle}
          subtitle={o.modalNewSubtitle}
          closeAriaLabel={oc.close}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{o.labelDisplayName}</label>
              <input
                required
                type="text"
                placeholder={o.placeholderOrgName}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({
                    name,
                    slug: slugTouched ? prev.slug : slugify(name),
                  }));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{o.labelSlug}</label>
              <input
                required
                type="text"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title={o.slugPatternTitle}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={formData.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
                }}
              />
              <p className="text-xs text-gray-500 mt-1">{o.slugHint}</p>
            </div>
            <div className="flex gap-3 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {o.cancel}
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {isCreating ? o.createOrgCreating : o.createOrg}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isAdminModalOpen && selectedOrg && (
        <ModalShell
          title={o.modalAdminTitle}
          subtitle={interpolate(o.modalAdminSubtitle, { name: selectedOrg.name })}
          closeAriaLabel={oc.close}
          onClose={() => setIsAdminModalOpen(false)}
        >
          <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{o.labelFirstName}</label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={adminFormData.first_name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{o.labelLastName}</label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={adminFormData.last_name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{o.labelPhoneLogin}</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={o.placeholderPhone}
                value={adminFormData.phone_number}
                onChange={(e) => setAdminFormData({ ...adminFormData, phone_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{o.labelEmailOptional}</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{o.labelInitialPassword}</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">{o.passwordChangeHint}</p>
            </div>
            <div className="flex gap-3 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {o.cancel}
              </button>
              <button
                type="submit"
                disabled={isCreatingAdmin}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {isCreatingAdmin ? o.createAdminCreating : o.createAdmin}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  closeAriaLabel,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  closeAriaLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-modal-title"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
          <div>
            <h3 id="org-modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label={closeAriaLabel}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}



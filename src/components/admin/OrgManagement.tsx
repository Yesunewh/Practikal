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
  const { data, isLoading, isFetching, isError, refetch } = useGetOrganizationsQuery(undefined);
  const [createOrg, { isLoading: isCreating }] = useCreateOrganizationMutation();
  const [createAdmin, { isLoading: isCreatingAdmin }] = useAdminCreateUserMutation();
  const [allocatePermission, { isLoading: isAllocating }] = useAllocatePermissionMutation();
  const [bulkAllocate, { isLoading: isBulking }] = useBulkAllocatePermissionsMutation();
  const { data: allUsersData, refetch: refetchAllUsers } = useGetUsersQuery(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
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
      toast.success('Organization created.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not create organization.');
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
      toast.success('Organization admin created.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not create organization admin.');
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
      toast.success('Permission updated.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not update permission.');
    }
  };

  const handleGrantFullSuite = async () => {
    if (!selectedOrg) return;
    if (!confirm('Grant all permissions to this organization?')) return;
    try {
      await bulkAllocate({ orgId: selectedOrg.id, effect: 'GRANT' }).unwrap();
      toast.success('All permissions granted to this organization.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Bulk grant failed.');
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
          <h2 className="text-xl font-semibold text-gray-900">Organizations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create tenants, assign org admins, and manage permissions for each organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
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
            New organization
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search by name or slug…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className="text-sm text-gray-500">
          {filteredOrgs.length} of {orgs.length} organizations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading && orgs.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
            <p className="text-sm font-medium">Loading organizations…</p>
          </div>
        ) : isError ? (
          <div className="col-span-full py-16 px-6 rounded-xl border border-red-200 bg-red-50 text-center">
            <ShieldAlert className="mx-auto text-red-500 mb-3" size={40} />
            <p className="font-medium text-red-900">Could not load organizations</p>
            <p className="text-sm text-red-800 mt-1">Check that the API is running and you are signed in as a superadmin.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-800 hover:bg-red-100/50"
            >
              Try again
            </button>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="col-span-full py-16 px-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
            <Building2 className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="font-medium text-gray-900">
              {orgs.length === 0 ? 'No organizations yet' : 'No matches'}
            </p>
            <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
              {orgs.length === 0
                ? 'Create your first organization to onboard customers or internal business units.'
                : 'Try a different search term.'}
            </p>
            {orgs.length === 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                <Plus size={18} />
                New organization
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
                      Plan: <span className="font-medium capitalize">{org.subscription_plan}</span>
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="text-gray-400" />
                    <span>
                      <span className="font-medium text-gray-900">{members}</span> member{members !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrg(org);
                      setIsConsoleOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700"
                  >
                    Manage
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
                    Add admin
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <ModalShell title="New organization" subtitle="Creates a tenant other users can be assigned to." onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                required
                type="text"
                placeholder="e.g. Acme Security"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">URL slug</label>
              <input
                required
                type="text"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Lowercase letters, numbers, and hyphens only"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={formData.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Unique identifier used in the API and admin tools.</p>
            </div>
            <div className="flex gap-3 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating…' : 'Create organization'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isAdminModalOpen && selectedOrg && (
        <ModalShell
          title="Add organization admin"
          subtitle={`Creates a user tied to ${selectedOrg.name}. They can sign in with the phone number below.`}
          onClose={() => setIsAdminModalOpen(false)}
        >
          <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={adminFormData.first_name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={adminFormData.last_name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (login)</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 0912345678"
                value={adminFormData.phone_number}
                onChange={(e) => setAdminFormData({ ...adminFormData, phone_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial password</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Ask them to change it after first login.</p>
            </div>
            <div className="flex gap-3 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingAdmin}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {isCreatingAdmin ? 'Creating…' : 'Create admin'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isConsoleOpen && selectedOrg && (
        <OrgConsole
          org={selectedOrg}
          onClose={() => setIsConsoleOpen(false)}
          onTogglePermission={handleTogglePermission}
          isAllocating={isAllocating}
          onGrantFullSuite={handleGrantFullSuite}
          isBulking={isBulking}
        />
      )}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
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
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface PermissionRow {
  id: string;
  name: string;
  description?: string;
  has_access?: boolean;
}

function OrgConsole({
  org,
  onClose,
  onTogglePermission,
  isAllocating,
  onGrantFullSuite,
  isBulking,
}: {
  org: OrganizationRow;
  onClose: () => void;
  onTogglePermission: (permId: string) => void;
  isAllocating: boolean;
  onGrantFullSuite: () => void;
  isBulking: boolean;
}) {
  const [tab, setTab] = useState<'permissions' | 'people' | 'structure'>('permissions');
  const [copied, setCopied] = useState(false);

  const { data: permsData, isLoading: permsLoading } = useGetAvailablePermissionsQuery(org.id);
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(org.id);
  const { data: deptsData, isLoading: deptsLoading } = useGetDepartmentsQuery(org.id);
  const { data: unitTree, isLoading: unitsLoading } = useGetUnitTreeQuery(org.id);

  const [resetPassword] = useResetUserPasswordMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();

  const copyId = useCallback(() => {
    void navigator.clipboard.writeText(org.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [org.id]);

  const handleResetPassword = async (userId: string) => {
    if (
      !confirm(
        'Reset this user’s password to the server default? (Password123 unless DEFAULT_PASSWORD is set in the API .env.)'
      )
    )
      return;
    try {
      const res = await resetPassword(userId).unwrap();
      const msg =
        res && typeof res === 'object' && 'message' in res
          ? String((res as { message?: string }).message)
          : '';
      const hint =
        res && typeof res === 'object' && 'login_hint' in res
          ? String((res as { login_hint?: string }).login_hint)
          : '';
      toast.success(hint ? `${msg || 'Password reset.'} — ${hint}` : msg || 'Password reset successfully.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Password reset failed.');
    }
  };

  const handleToggleStatus = async (user: ApiUser) => {
    try {
      if (user.status === 'ACTIVE') {
        await deactivateUser(user.user_id).unwrap();
        toast.success('User deactivated.');
      } else {
        await activateUser(user.user_id).unwrap();
        toast.success('User activated.');
      }
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not update user status.');
    }
  };

  const permissions = (permsData?.data ?? []) as PermissionRow[];
  const users = (usersData?.users ?? []) as ApiUser[];

  const tabs = [
    { id: 'permissions' as const, label: 'Permissions', icon: ShieldCheck },
    { id: 'people' as const, label: 'People', icon: Users },
    { id: 'structure' as const, label: 'Structure', icon: Network },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-5xl max-h-[92vh] flex flex-col min-h-0 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="shrink-0 p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <Building2 size={24} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 truncate">{org.name}</h3>
              <p className="text-sm text-gray-500 font-mono mt-0.5">/{org.slug}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {org.status ?? 'ACTIVE'}
                </span>
                <button
                  type="button"
                  onClick={copyId}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy org ID'}
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-start p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="shrink-0 px-5 sm:px-6 border-b border-gray-100 flex gap-1 overflow-x-auto bg-white">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 bg-gray-50/50">
          {tab === 'permissions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="font-medium text-gray-900">Product permissions</h4>
                  <p className="text-sm text-gray-600">Toggle modules this organization can use. Click again to revoke.</p>
                </div>
                <button
                  type="button"
                  onClick={onGrantFullSuite}
                  disabled={isBulking}
                  className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isBulking ? 'Applying…' : 'Grant all permissions'}
                </button>
              </div>
              {permsLoading ? (
                <div className="py-16 flex justify-center text-gray-500">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{perm.name}</p>
                        {perm.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{perm.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isAllocating}
                        onClick={() => onTogglePermission(perm.id)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          perm.has_access ? 'bg-emerald-600' : 'bg-gray-200'
                        } disabled:opacity-50`}
                        aria-pressed={!!perm.has_access}
                        aria-label={`${perm.has_access ? 'Disable' : 'Enable'} ${perm.name}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                            perm.has_access ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'people' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Users assigned to this organization.</p>
              {usersLoading ? (
                <div className="py-16 flex justify-center text-gray-500">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center bg-white rounded-xl border border-gray-200">
                  No users yet. Use <strong>Add admin</strong> from the card to create an org admin.
                </p>
              ) : (
                <ul className="space-y-2">
                  {users.map((u) => (
                    <li
                      key={u.user_id}
                      className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-semibold text-sm">
                          {(u.first_name?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {u.first_name} {u.last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Smartphone size={12} /> {u.phone_number ?? '—'}
                            </span>
                            {u.user_type && (
                              <span className="font-medium text-gray-600">{u.user_type.replace(/_/g, ' ')}</span>
                            )}
                            <span
                              className={`font-medium ${
                                u.status === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {u.status ?? '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u.user_id)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="Reset password"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-2 rounded-lg ${
                            u.status === 'ACTIVE'
                              ? 'text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          <Power size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'structure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Layers size={16} className="text-gray-400" />
                  Departments
                </h4>
                {deptsLoading ? (
                  <Loader2 className="animate-spin text-gray-400" />
                ) : (
                  <ul className="space-y-2">
                    {(deptsData?.depts ?? []).map((d: { id: string; name: string }) => (
                      <li
                        key={d.id}
                        className="bg-white px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-800 flex items-center gap-2"
                      >
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                        {d.name}
                      </li>
                    ))}
                    {(deptsData?.depts ?? []).length === 0 && (
                      <li className="text-sm text-gray-500 italic py-4 px-4 bg-white rounded-lg border border-dashed border-gray-200">
                        No departments yet. Create them under Branch hierarchy or your dept workflow.
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Layout size={16} className="text-gray-400" />
                  Organizational units
                </h4>
                {unitsLoading ? (
                  <Loader2 className="animate-spin text-gray-400" />
                ) : (
                  <ul className="space-y-2">
                    {(unitTree?.data ?? []).map((u: { id: string; name: string; UnitType?: { name?: string } }) => (
                      <li key={u.id} className="bg-white px-4 py-3 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        {u.UnitType?.name && (
                          <p className="text-xs text-gray-500 mt-0.5">{u.UnitType.name}</p>
                        )}
                      </li>
                    ))}
                    {(unitTree?.data ?? []).length === 0 && (
                      <li className="text-sm text-gray-500 italic py-4 px-4 bg-white rounded-lg border border-dashed border-gray-200">
                        No units in the tree for this organization.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:px-6 border-t border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Calendar size={12} />
            Organization ID: <span className="font-mono text-gray-700">{org.id.slice(0, 8)}…</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

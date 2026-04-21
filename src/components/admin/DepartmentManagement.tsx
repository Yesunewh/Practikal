import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import {
  Building2,
  Layers,
  Loader2,
  Plus,
  UserPlus,
  Crown,
  Pencil,
  BookOpen,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  KeyRound,
  UserX,
  UserCheck,
  Smartphone,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadCsv, parseCsv, normalizeStaffImportPhone } from '../../utils/csv';
import {
  useGetOrganizationsQuery,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useGetUsersQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserScopeMutation,
  useResetUserPasswordMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
} from '../../store/apiSlice/practikalApi';

interface DepartmentManagementProps {
  currentUser: User;
}

interface DeptStaffMember {
  user_id: string;
  first_name: string;
  last_name: string;
  user_type: string;
  phone_number?: string | null;
  email?: string | null;
  status?: string | null;
}

interface DeptRow {
  id: string;
  name: string;
  description?: string | null;
  org_id: string;
  status?: string;
  DepartmentStaff?: DeptStaffMember[];
}

function rtkErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const o = err as Record<string, unknown>;
  if (o.data && typeof o.data === 'object') {
    const m = (o.data as Record<string, unknown>).message;
    if (typeof m === 'string' && m) return m;
  }
  return '';
}

function normalizeCsvHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

function csvRowToRecord(headers: string[], cells: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  headers.forEach((h, i) => {
    o[normalizeCsvHeader(h)] = (cells[i] ?? '').trim();
  });
  return o;
}

function pickCell(o: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

export default function DepartmentManagement({ currentUser }: DepartmentManagementProps) {
  const navigate = useNavigate();
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN';
  const isDeptAdmin =
    currentUser.user_type === 'DEPT_ADMIN' ||
    (currentUser.role === 'admin' &&
      !!currentUser.deptId &&
      (currentUser.user_type == null || currentUser.user_type === ''));
  const canPlanStructure = isSuperAdmin || isOrgAdmin;
  const hasAccess = isSuperAdmin || isOrgAdmin || isDeptAdmin;

  const { data: orgsData, isLoading: orgsLoading } = useGetOrganizationsQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const orgs = (orgsData?.orgs ?? []) as { id: string; name: string; slug: string }[];

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [editDept, setEditDept] = useState<DeptRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [addStaffDept, setAddStaffDept] = useState<DeptRow | null>(null);
  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: 'Password123',
  });

  const [assignDept, setAssignDept] = useState<DeptRow | null>(null);
  const [assignUserId, setAssignUserId] = useState('');

  const [importDept, setImportDept] = useState<DeptRow | null>(null);
  const [importDefaultPassword, setImportDefaultPassword] = useState('Password123');
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((isOrgAdmin || isDeptAdmin) && currentUser.orgId) {
      setSelectedOrgId(currentUser.orgId);
    }
  }, [isOrgAdmin, isDeptAdmin, currentUser.orgId]);

  const { data: deptsData, isLoading: deptsLoading, isFetching: deptsFetching } = useGetDepartmentsQuery(
    selectedOrgId,
    { skip: !hasAccess || !selectedOrgId }
  );
  const deptsAll = (deptsData?.depts ?? []) as DeptRow[];
  const depts = useMemo(() => {
    if (isDeptAdmin && currentUser.deptId) {
      return deptsAll.filter((d) => d.id === currentUser.deptId);
    }
    return deptsAll;
  }, [deptsAll, isDeptAdmin, currentUser.deptId]);

  const { data: orgUsersData } = useGetUsersQuery(selectedOrgId, {
    skip: !hasAccess || !selectedOrgId,
  });
  const orgUsers = (orgUsersData?.users ?? []) as Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    user_type: string;
    dept_id?: string | null;
  }>;

  const [createDept, { isLoading: creating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: updating }] = useUpdateDepartmentMutation();
  const [createUser, { isLoading: creatingUser }] = useAdminCreateUserMutation();
  const [patchScope, { isLoading: patching }] = useAdminUpdateUserScopeMutation();
  const [resetPassword] = useResetUserPasswordMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [rosterActionUserId, setRosterActionUserId] = useState<string | null>(null);

  const assignCandidates = useMemo(() => {
    if (!assignDept) return [];
    if (isDeptAdmin) {
      return orgUsers.filter(
        (u) =>
          (u.user_type === 'STAFF' || u.user_type === 'EXTERNAL') &&
          (u.dept_id == null || u.dept_id === '')
      );
    }
    return orgUsers.filter(
      (u) =>
        u.user_type !== 'SUPERADMIN' &&
        (u.dept_id == null || String(u.dept_id) !== assignDept.id)
    );
  }, [assignDept, orgUsers, isDeptAdmin]);

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
        You need org admin, department head, or superadmin access to manage departments.
      </div>
    );
  }

  const exportDeptStaff = (d: DeptRow) => {
    const staff = d.DepartmentStaff ?? [];
    downloadCsv(
      ['user_id', 'first_name', 'last_name', 'user_type'],
      staff.map((s) => [s.user_id, s.first_name, s.last_name, s.user_type]),
      `${d.name.replace(/[^\w\-]+/g, '-')}-staff.csv`
    );
    toast.success('Staff list exported.');
  };

  const downloadStaffImportTemplate = () => {
    downloadCsv(
      ['first_name', 'last_name', 'phone_number', 'email', 'password'],
      [['Jane', 'Doe', '0912345678', '', 'Password123']],
      'staff-import-template.csv'
    );
  };

  const runStaffImport = async (file: File) => {
    if (!importDept || !selectedOrgId) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error('Could not read the file.');
      return;
    }
    const table = parseCsv(text);
    if (table.length < 2) {
      toast.error('The CSV needs a header row and at least one data row.');
      return;
    }
    const headerRow = table[0];
    const dataRows = table.slice(1);
    const pwdDefault = importDefaultPassword.trim().length >= 6 ? importDefaultPassword.trim() : 'Password123';

    let ok = 0;
    let fail = 0;
    let skipped = 0;
    let firstErr = '';

    setImporting(true);
    try {
      for (let i = 0; i < dataRows.length; i++) {
        const cells = dataRows[i];
        if (!cells.length || cells.every((c) => !String(c).trim())) {
          skipped += 1;
          continue;
        }
        const rec = csvRowToRecord(headerRow, cells);
        const first_name = pickCell(rec, ['first_name', 'firstname', 'first', 'given_name']);
        const last_name = pickCell(rec, ['last_name', 'lastname', 'last', 'surname', 'family_name']);
        const phone_number = normalizeStaffImportPhone(pickCell(rec, ['phone_number', 'phone', 'mobile', 'tel', 'msisdn']));
        const emailRaw = pickCell(rec, ['email', 'e_mail']);
        let password = pickCell(rec, ['password', 'pass', 'initial_password']);
        if (!password || password.length < 6) password = pwdDefault;

        if (!first_name || !last_name || phone_number.length !== 10 || !/^\d+$/.test(phone_number)) {
          fail += 1;
          if (!firstErr) firstErr = `Row ${i + 2}: need first name, last name, and a 10-digit phone.`;
          continue;
        }

        try {
          await createUser({
            first_name,
            last_name,
            phone_number,
            email: emailRaw || undefined,
            password,
            user_type: 'STAFF',
            org_id: selectedOrgId,
            dept_id: importDept.id,
            status: 'ACTIVE',
          }).unwrap();
          ok += 1;
        } catch (err) {
          fail += 1;
          if (!firstErr) firstErr = `Row ${i + 2} (${phone_number}): ${rtkErrorMessage(err) || 'Could not create user.'}`;
        }
      }
    } finally {
      setImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }

    if (ok) toast.success(`Imported ${ok} staff member${ok === 1 ? '' : 's'}.`);
    if (fail) toast.error(firstErr || `${fail} row(s) could not be imported.`);
    if (!ok && !fail && skipped) toast.error('No data rows found (only empty lines).');
    if (!ok && !fail && !skipped) toast.error('No data rows to import.');
    if (ok || fail) {
      setImportDept(null);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !newName.trim()) return;
    try {
      await createDept(
        isSuperAdmin
          ? {
              name: newName.trim(),
              description: newDescription.trim() || undefined,
              org_id: selectedOrgId,
            }
          : {
              name: newName.trim(),
              description: newDescription.trim() || undefined,
            }
      ).unwrap();
      setNewName('');
      setNewDescription('');
      toast.success('Department created.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not create department.');
    }
  };

  const openEdit = (d: DeptRow) => {
    setEditDept(d);
    setEditName(d.name);
    setEditDescription(d.description ?? '');
  };

  const saveEdit = async () => {
    if (!editDept || !editName.trim()) return;
    try {
      await updateDept({
        id: editDept.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
      }).unwrap();
      setEditDept(null);
      toast.success('Department updated.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not update department.');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStaffDept || !selectedOrgId) return;
    try {
      await createUser({
        first_name: staffForm.first_name.trim(),
        last_name: staffForm.last_name.trim(),
        phone_number: normalizeStaffImportPhone(staffForm.phone_number),
        email: staffForm.email.trim() || undefined,
        password: staffForm.password,
        user_type: 'STAFF',
        org_id: selectedOrgId,
        dept_id: addStaffDept.id,
        status: 'ACTIVE',
      }).unwrap();
      setAddStaffDept(null);
      setStaffForm({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        password: 'Password123',
      });
      toast.success('Staff member created.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not create staff user (10-digit phone, unique).');
    }
  };

  const handleAssignExisting = async () => {
    if (!assignDept || !assignUserId) return;
    try {
      await patchScope({
        userId: assignUserId,
        dept_id: assignDept.id,
        user_type: 'STAFF',
      }).unwrap();
      setAssignDept(null);
      setAssignUserId('');
      toast.success('User assigned to department.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not assign user to department.');
    }
  };

  const setHead = async (userId: string, deptId: string) => {
    if (!confirm('Make this user the department head? Any other DEPT_ADMIN in this department becomes STAFF.')) return;
    try {
      await patchScope({
        userId,
        dept_id: deptId,
        user_type: 'DEPT_ADMIN',
      }).unwrap();
      toast.success('Department head updated.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not set department head.');
    }
  };

  const removeFromDept = async (userId: string) => {
    if (!confirm('Remove this user from the department?')) return;
    try {
      await patchScope({
        userId,
        dept_id: null,
        user_type: 'STAFF',
      }).unwrap();
      toast.success('User removed from department.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not update user.');
    }
  };

  const canRosterSecurityActions = (s: DeptStaffMember) => {
    if (isSuperAdmin) return true;
    if (isOrgAdmin) return !['SUPERADMIN', 'ORG_ADMIN'].includes(s.user_type);
    if (isDeptAdmin) return ['STAFF', 'EXTERNAL'].includes(s.user_type);
    return false;
  };

  const rosterResetPassword = async (userId: string) => {
    if (
      !confirm(
        'Reset this person’s password to the platform default? They sign in with their phone number and the new temporary password.'
      )
    ) {
      return;
    }
    setRosterActionUserId(userId);
    try {
      const res = await resetPassword(userId).unwrap();
      const hint = (res as { login_hint?: string }).login_hint;
      toast.success(
        hint ? `${(res as { message?: string }).message ?? 'Password reset.'} ${hint}` : 'Password reset.'
      );
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not reset password.');
    } finally {
      setRosterActionUserId(null);
    }
  };

  const rosterDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this account? They will not be able to sign in until reactivated.')) return;
    setRosterActionUserId(userId);
    try {
      await deactivateUser(userId).unwrap();
      toast.success('User deactivated.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not deactivate.');
    } finally {
      setRosterActionUserId(null);
    }
  };

  const rosterActivate = async (userId: string) => {
    setRosterActionUserId(userId);
    try {
      await activateUser(userId).unwrap();
      toast.success('User activated.');
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || 'Could not activate.');
    } finally {
      setRosterActionUserId(null);
    }
  };

  const goChallenges = (orgId: string, deptId: string, startCreating: boolean) => {
    const params = new URLSearchParams();
    params.set('tab', 'authoring');
    params.set('dept', deptId);
    if (startCreating) params.set('new', '1');
    navigate(
      { pathname: '/admin/challenges', search: params.toString() },
      { state: { presetOrgId: orgId, presetDeptId: deptId, startCreating } }
    );
  };

  const selectedOrgLabel =
    isSuperAdmin && selectedOrgId
      ? orgs.find((o) => o.id === selectedOrgId)?.name ?? selectedOrgId
      : currentUser.organization || 'Your organization';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="text-emerald-600" size={24} />
              Departments & teams
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Org admins define the horizontal structure (departments) and heads; department heads manage their roster,
              export staff, and author challenges for their team. Superadmins can work across all tenants.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
          {isSuperAdmin ? (
            orgsLoading ? (
              <Loader2 className="animate-spin text-emerald-600" size={22} />
            ) : (
              <select
                className="w-full max-w-md px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setExpandedId(null);
                }}
              >
                <option value="">Select organization…</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.slug})
                  </option>
                ))}
              </select>
            )
          ) : (
            <p className="text-sm text-gray-900 font-medium py-2">{selectedOrgLabel}</p>
          )}
        </div>
      </div>

      {selectedOrgId && (
        <>
          {canPlanStructure && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">New department</h3>
            <form onSubmit={handleCreateDept} className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Compliance"
                />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Create
              </button>
            </form>
          </div>
          )}

          <div className="space-y-3">
            {deptsLoading || deptsFetching ? (
              <div className="py-16 flex justify-center text-gray-500">
                <Loader2 className="animate-spin" size={28} />
              </div>
            ) : depts.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center bg-white rounded-xl border border-dashed border-gray-200">
                {canPlanStructure
                  ? 'No departments yet. Create one above.'
                  : 'No department is assigned to your account.'}
              </p>
            ) : (
              depts.map((d) => {
                const staff = d.DepartmentStaff ?? [];
                const head = staff.find((s) => s.user_type === 'DEPT_ADMIN');
                const open = expandedId === d.id;
                return (
                  <div key={d.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 size={18} className="text-emerald-600 shrink-0" />
                          <h4 className="font-semibold text-gray-900 truncate">{d.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.status ?? 'ACTIVE'}</span>
                        </div>
                        {d.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{d.description}</p>}
                        <p className="text-xs text-gray-400 mt-1 font-mono">ID: {d.id}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {staff.length} staff
                          {head && (
                            <span className="ml-2 text-emerald-700">
                              · Head: {head.first_name} {head.last_name}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => goChallenges(selectedOrgId, d.id, true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                        >
                          <PlusCircle size={16} />
                          New challenge (this department)
                        </button>
                        <button
                          type="button"
                          onClick={() => goChallenges(selectedOrgId, d.id, false)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <BookOpen size={16} />
                          Browse challenges
                        </button>
                        <button
                          type="button"
                          onClick={() => exportDeptStaff(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <Download size={16} />
                          Export staff
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportDept(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <Upload size={16} />
                          Import staff
                        </button>
                        {canPlanStructure && (
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAddStaffDept(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <UserPlus size={16} />
                          Add staff
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignDept(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-50"
                        >
                          Assign existing user
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : d.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg"
                        >
                          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {open ? 'Hide' : 'Show'} roster
                        </button>
                      </div>
                    </div>
                    {open && (
                      <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3">
                        {staff.length === 0 ? (
                          <p className="text-sm text-gray-500">No staff assigned yet.</p>
                        ) : (
                          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                            {staff.map((s) => (
                              <li
                                key={s.user_id}
                                className="px-3 py-3 flex flex-col sm:flex-row sm:items-start gap-3 text-sm border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="font-medium text-gray-900">
                                    {s.first_name} {s.last_name}
                                    {s.user_type === 'DEPT_ADMIN' && (
                                      <Crown size={14} className="inline ml-1 text-amber-600" aria-label="Department head" />
                                    )}
                                    <span className="ml-2 text-gray-500 text-xs font-normal">
                                      {s.user_type.replace(/_/g, ' ')}
                                    </span>
                                    {s.status && s.status !== 'ACTIVE' && (
                                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                        {s.status}
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Smartphone size={14} className="text-gray-400 shrink-0" />
                                      <span className="font-mono truncate">{s.phone_number || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Mail size={14} className="text-gray-400 shrink-0" />
                                      <span className="break-all">{s.email?.trim() ? s.email : '—'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 sm:justify-end shrink-0">
                                  {canRosterSecurityActions(s) && (
                                    <button
                                      type="button"
                                      onClick={() => void rosterResetPassword(s.user_id)}
                                      disabled={patching || rosterActionUserId === s.user_id}
                                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-amber-200 text-amber-900 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
                                    >
                                      {rosterActionUserId === s.user_id ? (
                                        <Loader2 className="animate-spin" size={14} />
                                      ) : (
                                        <KeyRound size={14} />
                                      )}
                                      Reset password
                                    </button>
                                  )}
                                  {canRosterSecurityActions(s) && s.status !== 'DEACTIVATED' && (
                                    <button
                                      type="button"
                                      onClick={() => void rosterDeactivate(s.user_id)}
                                      disabled={patching || rosterActionUserId === s.user_id}
                                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-rose-200 text-rose-800 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                                    >
                                      <UserX size={14} />
                                      Deactivate
                                    </button>
                                  )}
                                  {canRosterSecurityActions(s) && s.status === 'DEACTIVATED' && (
                                    <button
                                      type="button"
                                      onClick={() => void rosterActivate(s.user_id)}
                                      disabled={patching || rosterActionUserId === s.user_id}
                                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
                                    >
                                      <UserCheck size={14} />
                                      Activate
                                    </button>
                                  )}
                                  {canPlanStructure && s.user_type !== 'DEPT_ADMIN' && (
                                    <button
                                      type="button"
                                      onClick={() => setHead(s.user_id, d.id)}
                                      disabled={patching}
                                      className="text-xs px-2 py-1 rounded border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                                    >
                                      Set head
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeFromDept(s.user_id)}
                                    disabled={patching}
                                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {editDept && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Edit department</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditDept(null)} className="px-3 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={updating}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50"
              >
                {updating ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addStaffDept && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Add staff — {addStaffDept.name}</h3>
            <p className="text-xs text-gray-500">
              Phone: 10 digits local (e.g. 09…), or <span className="font-mono">+251</span> /{' '}
              <span className="font-mono">251</span>… — it is normalized before save.
            </p>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="First name"
                  className="px-3 py-2 border rounded-lg text-sm"
                  value={staffForm.first_name}
                  onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                />
                <input
                  required
                  placeholder="Last name"
                  className="px-3 py-2 border rounded-lg text-sm"
                  value={staffForm.last_name}
                  onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                />
              </div>
              <input
                required
                placeholder="Phone (10 digits)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={staffForm.phone_number}
                onChange={(e) => setStaffForm({ ...staffForm, phone_number: e.target.value })}
              />
              <input
                placeholder="Email (optional)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              />
              <input
                required
                placeholder="Initial password"
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddStaffDept(null)} className="px-3 py-2 text-sm text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                >
                  {creatingUser ? 'Creating…' : 'Create staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importDept && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Import staff — {importDept.name}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Use a CSV with headers: <span className="font-mono">first_name</span>,{' '}
              <span className="font-mono">last_name</span>, <span className="font-mono">phone_number</span> (10 digits;
              leading <span className="font-mono">+251</span> is accepted). Optional:{' '}
              <span className="font-mono">email</span>, <span className="font-mono">password</span> (min 6 characters). If
              password is missing or too short, the default below is used.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default password</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                value={importDefaultPassword}
                onChange={(e) => setImportDefaultPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadStaffImportTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Download size={16} />
                Download template
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={() => importFileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {importing ? 'Importing…' : 'Choose CSV file'}
              </button>
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void runStaffImport(f);
              }}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setImportDept(null);
                  if (importFileRef.current) importFileRef.current.value = '';
                }}
                className="px-3 py-2 text-sm text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {assignDept && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Assign user — {assignDept.name}</h3>
            <select
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            >
              <option value="">Select user in this organization…</option>
              {assignCandidates.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.first_name} {u.last_name} ({u.user_type})
                  {u.dept_id ? ' — has dept' : ''}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAssignDept(null)} className="px-3 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAssignExisting()}
                disabled={!assignUserId || patching}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50"
              >
                Assign to department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

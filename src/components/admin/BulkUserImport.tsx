import { useState, useRef, useCallback } from 'react';
import * as xlsx from 'xlsx';
import { useGetRolesQuery, useGetDepartmentsQuery, useAdminCreateUserMutation } from '../../store/apiSlice/practikalApi';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';
import {
  UploadCloud,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
  Download,
  Building2,
  Layers,
} from 'lucide-react';
import { User } from '../../types';

type ParsedUserRow = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
};

type RoleItem = {
  id: string;
  name: string;
  org_id?: string | null;
};

type LogRow = { msg: string; isError: boolean };

const TEMPLATE_FILENAME = 'practikal-bulk-users-template.xlsx';

/** Sample rows — column names match parser (`name`, `email`, `phone`, optional `password`). */
function buildTemplateWorkbook() {
  const rows = [
    {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '0912345678',
      password: 'Welcome123!',
      role: 'Department Admin',
    },
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '0987654321',
      password: '',
      role: 'Learner',
    },
  ];
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Users');
  return wb;
}

const DEFAULT_IMPORT_PASSWORD = 'Welcome123!';

export default function BulkUserImport({ currentUser }: { currentUser: User }) {
  const { messages } = useI18n();
  const bi = messages.admin.bulkImport;
  const orgId = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;
  const { data: rolesRes, isLoading: loadingRoles } = useGetRolesQuery({ orgId, includeSystem: true });
  const { data: deptsRes, isLoading: loadingDepts } = useGetDepartmentsQuery(orgId);
  const [createUser] = useAdminCreateUserMutation();

  const [selectedUnitId, setSelectedUnitId] = useState(currentUser.unitId || '');
  const [selectedDeptId, setSelectedDeptId] = useState(currentUser.deptId || '');
  const [parsedData, setParsedData] = useState<ParsedUserRow[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('idle');
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const rolesData = (rolesRes?.data ?? []) as RoleItem[];
  const allDepartments = (deptsRes?.depts ?? []) as { id: string; name: string; unit_id?: string | null }[];

  const roles = rolesData.filter(r => {
    const n = r.name.toLowerCase();
    return n.includes('learner') || n.includes('staff') || n.includes('department admin');
  });

  const isSuperAdmin = currentUser.user_type === 'SUPERADMIN' || currentUser.role === 'superadmin';
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN' || (currentUser.role === 'admin' && currentUser.orgId && !currentUser.user_type);
  const isDeptAdmin = currentUser.user_type === 'DEPT_ADMIN' || (currentUser.role === 'admin' && !!currentUser.deptId && !currentUser.user_type);

  const filteredDepartments = allDepartments.filter(d => {
    // SuperAdmins and OrgAdmins can see all departments in the organization
    if (isSuperAdmin || isOrgAdmin) return true;
    
    // DeptAdmins only see their own department
    if (isDeptAdmin) return d.id === currentUser.deptId;
    
    // Others (like UNIT_ADMIN) only see departments in their own unit
    if (!selectedUnitId) return !d.unit_id; 
    return d.unit_id === selectedUnitId;
  });

  const downloadTemplate = useCallback(() => {
    const wb = buildTemplateWorkbook();
    xlsx.writeFile(wb, TEMPLATE_FILENAME);
  }, []);

  const splitName = (fullName: string) => {
    const parts = String(fullName ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || first_name || bi.defaultLastName;
    return { first_name, last_name };
  };

  const normalizePhoneNumber = (value: string | number | undefined | null) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  };

  const processSpreadsheetFile = useCallback((file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls') && !lower.endsWith('.csv')) {
      alert(bi.alertWrongFile);
      return;
    }

    setUploadStatus('checking');

    const reader = new FileReader();
    reader.onload = (evt: ProgressEvent<FileReader>) => {
      try {
        const bstr = evt.target?.result;
        if (typeof bstr !== 'string') throw new Error('Unexpected file format');
        const workbook = xlsx.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws) as Array<Record<string, unknown>>;

        const readFirst = (row: Record<string, unknown>, keys: string[]) => {
          for (const k of keys) {
            const v = row[k];
            if (typeof v === 'string') return v;
            if (typeof v === 'number') return String(v);
          }
          return '';
        };

        const formatted = data
          .map((row) => ({
            name: readFirst(row, ['name', 'Name', 'NAME']),
            email: readFirst(row, ['email', 'Email', 'EMAIL']),
            password: readFirst(row, ['password', 'Password', 'PASSWORD']) || DEFAULT_IMPORT_PASSWORD,
            phone: readFirst(row, ['phone', 'Phone', 'PHONE']),
            role: readFirst(row, ['role', 'Role', 'ROLE']) || 'Learner',
          }))
          .filter((r) => r.name && r.email && r.phone);

        setParsedData(formatted);
        setUploadStatus('idle');
      } catch {
        setUploadStatus('idle');
        alert(bi.alertReadError);
      }
    };
    reader.readAsBinaryString(file);
  }, [bi.alertReadError, bi.alertWrongFile]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    processSpreadsheetFile(file);
  };

  const executeBulkImport = async () => {
    if (parsedData.length === 0) return alert(bi.alertNoRows);

    setUploadStatus('uploading');
    setLogs([{ msg: interpolate(bi.logStarting, { count: parsedData.length }), isError: false }]);

    let successCount = 0;

    for (const user of parsedData) {
      try {
        const { first_name, last_name } = splitName(user.name);
        const phone_number = normalizePhoneNumber(user.phone);

        if (!phone_number || phone_number.length !== 10) {
          throw new Error(interpolate(bi.invalidPhone, { name: user.name }));
        }

        const targetRoleName = (user.role || 'Learner').trim().toLowerCase();
        // Match against all roles (including filtered ones for safety, or just rolesData)
        const matchedRole = rolesData.find(r => r.name.toLowerCase() === targetRoleName) 
                         || rolesData.find(r => r.name.toLowerCase().includes('learner'))
                         || rolesData[0];

        if (!matchedRole) {
          throw new Error(interpolate(bi.logFailed, { name: user.name, msg: 'Role not found in system' }));
        }

        const isDeptAdminRole = matchedRole.name.toLowerCase().includes('admin');
        const userType = isDeptAdminRole ? 'DEPT_ADMIN' : 'STAFF';

        await createUser({
          first_name,
          last_name,
          email: user.email,
          password: user.password,
          phone_number,
          role_id: matchedRole.id,
          unit_id: selectedUnitId || null,
          dept_id: selectedDeptId || null,
          org_id: orgId,
          user_type: userType,
          status: 'ACTIVE',
        }).unwrap();

        successCount++;
        setLogs((prev) => [...prev, { msg: interpolate(bi.logOk, { name: user.name, email: user.email }), isError: false }]);
      } catch (error: unknown) {
        const err = error as { data?: { message?: unknown }; message?: unknown };
        const msg =
          typeof err.data?.message === 'string'
            ? err.data.message
            : typeof err.message === 'string'
              ? err.message
              : bi.requestFailed;
        setLogs((prev) => [
          ...prev,
          { msg: interpolate(bi.logFailed, { name: user.name, msg: String(msg) }), isError: true },
        ]);
      }
    }

    setUploadStatus('success');
    setLogs((prev) => [
      ...prev,
      {
        msg: interpolate(bi.logDone, { success: successCount, total: parsedData.length }),
        isError: false,
      },
    ]);
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-white to-emerald-50/40 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <FileSpreadsheet size={20} strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{bi.kicker}</p>
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{bi.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          >
            <Download size={18} className="shrink-0" aria-hidden />
            {bi.downloadTemplate}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid divide-y divide-gray-100 md:grid-cols-12 md:divide-x md:divide-y-0 md:items-start">
          <div className="space-y-4 p-4 sm:p-5 md:col-span-5">
            <p className="text-xs text-gray-500">
              {interpolate(bi.columnsHint, { defaultPwd: DEFAULT_IMPORT_PASSWORD })}
            </p>



            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">{bi.department || "Department"}</label>
              {loadingDepts ? (
                <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
              ) : (
                <select 
                  value={selectedDeptId} 
                  onChange={(e) => setSelectedDeptId(e.target.value)} 
                  className={`${inputClass} ${isDeptAdmin ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  disabled={isDeptAdmin}
                >
                  {!isDeptAdmin && <option value="">{bi.selectDepartment || "Select department…"}</option>}
                  {filteredDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

          </div>

          <div className="flex flex-col p-4 sm:p-5 md:col-span-7">
            {uploadStatus === 'idle' && parsedData.length === 0 && (
              <div className="mx-auto w-full max-w-md">
                <div
                  role="button"
                  tabIndex={0}
                  className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:py-6 ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-50/60'
                      : 'border-gray-200 bg-gray-50/50 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.currentTarget === e.target) setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processSpreadsheetFile(file);
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInputChange}
                  />
                  <UploadCloud size={26} className="mb-2 shrink-0 text-gray-400" aria-hidden />
                  <span className="text-center text-sm font-semibold text-gray-800">{bi.dropzoneTitle}</span>
                  <span className="mt-0.5 text-center text-xs text-gray-500">{bi.dropzoneTypes}</span>
                </div>
              </div>
            )}

            {uploadStatus === 'checking' && (
              <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2 py-8">
                <Loader2 size={28} className="animate-spin text-emerald-600" aria-hidden />
                <p className="text-sm font-medium text-gray-600">{bi.readingFile}</p>
              </div>
            )}

            {parsedData.length > 0 && uploadStatus === 'idle' && (
              <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4 text-center">
                  <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                    <Check size={20} strokeWidth={2.5} aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-emerald-950">
                    {parsedData.length === 1
                      ? bi.rowsReadySingular
                      : interpolate(bi.rowsReadyPlural, { count: parsedData.length })}
                  </p>
                  <button
                    type="button"
                    onClick={executeBulkImport}
                    className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bi.importUsers}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setParsedData([])}
                  className="text-center text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  {bi.clearFile}
                </button>
              </div>
            )}

            {(uploadStatus === 'uploading' || uploadStatus === 'success') && (
              <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
                  <span className="text-xs font-medium text-gray-600">{bi.importLog}</span>
                  {uploadStatus === 'uploading' && <Loader2 size={16} className="animate-spin text-emerald-600" />}
                </div>
                <div className="max-h-48 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed sm:max-h-56">
                  {logs.map((log, i) => (
                    <div key={i} className={log.isError ? 'text-rose-700' : 'text-gray-700'}>
                      {log.msg}
                    </div>
                  ))}
                  {uploadStatus === 'uploading' && <div className="mt-1 text-emerald-600">…</div>}
                </div>
                {uploadStatus === 'success' && (
                  <div className="border-t border-gray-200 bg-white px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadStatus('idle');
                        setParsedData([]);
                        setLogs([]);
                      }}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                    >
                      {bi.importAnother}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

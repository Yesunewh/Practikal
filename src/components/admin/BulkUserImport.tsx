import { useState, useRef, useCallback } from 'react';
import * as xlsx from 'xlsx';
import { useGetUnitTreeQuery, useGetRolesQuery, useAdminCreateUserMutation } from '../../store/apiSlice/practikalApi';
import {
  UploadCloud,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { User } from '../../types';

type ParsedUserRow = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

type UnitNode = {
  id: string;
  name: string;
  children?: UnitNode[];
  SubUnits?: UnitNode[];
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
    },
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '0987654321',
      password: '',
    },
  ];
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Users');
  return wb;
}

export default function BulkUserImport({ currentUser }: { currentUser: User }) {
  const orgId = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;

  const { data: treeRes, isLoading: loadingTree } = useGetUnitTreeQuery(orgId);
  const { data: rolesRes, isLoading: loadingRoles } = useGetRolesQuery({ orgId, includeSystem: true });
  const [createUser] = useAdminCreateUserMutation();

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [parsedData, setParsedData] = useState<ParsedUserRow[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('idle');
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const units = (treeRes?.data ?? []) as UnitNode[];
  const roles = (rolesRes?.data ?? []) as RoleItem[];

  const flattenUnits = (nodes: UnitNode[], prefix = ''): { id: string; name: string }[] => {
    let result: { id: string; name: string }[] = [];
    for (const node of nodes) {
      result.push({ id: node.id, name: `${prefix}${node.name}` });
      const kids = node.SubUnits || node.children;
      if (kids?.length) {
        result = result.concat(flattenUnits(kids, `${prefix}— `));
      }
    }
    return result;
  };
  const flatUnits = flattenUnits(units);

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
    const last_name = parts.slice(1).join(' ') || first_name || 'User';
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
      alert('Please choose an Excel or CSV file (.xlsx, .xls, .csv).');
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
            password: readFirst(row, ['password', 'Password', 'PASSWORD']) || 'Welcome123!',
            phone: readFirst(row, ['phone', 'Phone', 'PHONE']),
          }))
          .filter((r) => r.name && r.email && r.phone);

        setParsedData(formatted);
        setUploadStatus('idle');
      } catch {
        setUploadStatus('idle');
        alert(
          'Could not read the file. Use the downloaded template: columns name, email, phone (required, 10 digits), password (optional).',
        );
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    processSpreadsheetFile(file);
  };

  const executeBulkImport = async () => {
    if (!selectedRoleId) return alert('Select a role.');
    if (!selectedUnitId) return alert('Select a branch / unit.');
    if (parsedData.length === 0) return alert('Upload a file with at least one valid row.');

    setUploadStatus('uploading');
    setLogs([{ msg: `Starting import of ${parsedData.length} user(s)…`, isError: false }]);

    let successCount = 0;

    for (const user of parsedData) {
      try {
        const { first_name, last_name } = splitName(user.name);
        const phone_number = normalizePhoneNumber(user.phone);

        if (!phone_number || phone_number.length !== 10) {
          throw new Error(`Invalid phone for ${user.name} (need 10 digits).`);
        }

        await createUser({
          first_name,
          last_name,
          email: user.email,
          password: user.password,
          phone_number,
          role_id: selectedRoleId,
          unit_id: selectedUnitId,
          org_id: orgId,
          user_type: 'STAFF',
          status: 'ACTIVE',
        }).unwrap();

        successCount++;
        setLogs((prev) => [...prev, { msg: `OK: ${user.name} (${user.email})`, isError: false }]);
      } catch (error: unknown) {
        const err = error as { data?: { message?: unknown }; message?: unknown };
        const msg =
          typeof err.data?.message === 'string'
            ? err.data.message
            : typeof err.message === 'string'
              ? err.message
              : 'Request failed';
        setLogs((prev) => [...prev, { msg: `Failed: ${user.name} — ${msg}`, isError: true }]);
      }
    }

    setUploadStatus('success');
    setLogs((prev) => [
      ...prev,
      { msg: `Done. ${successCount} of ${parsedData.length} imported.`, isError: false },
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
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Bulk import</p>
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Import users from Excel</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          >
            <Download size={18} className="shrink-0" aria-hidden />
            Download sample template
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid divide-y divide-gray-100 md:grid-cols-12 md:divide-x md:divide-y-0 md:items-start">
          <div className="space-y-4 p-4 sm:p-5 md:col-span-5">
            <p className="text-xs text-gray-500">
              Required columns: <span className="font-medium text-gray-700">name</span>,{' '}
              <span className="font-medium text-gray-700">email</span>,{' '}
              <span className="font-medium text-gray-700">phone</span> (10 digits). Optional:{' '}
              <span className="font-medium text-gray-700">password</span> (default Welcome123!).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Branch / unit</label>
              {loadingTree ? (
                <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
              ) : (
                <select value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} className={inputClass}>
                  <option value="">Select branch…</option>
                  {flatUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Role</label>
              {loadingRoles ? (
                <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
              ) : (
                <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className={inputClass}>
                  <option value="">Select role…</option>
                  {roles.map((r: RoleItem) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.org_id ? ' (custom)' : ' (system)'}
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
                  <span className="text-center text-sm font-semibold text-gray-800">
                    Choose file or drop spreadsheet
                  </span>
                  <span className="mt-0.5 text-center text-xs text-gray-500">.xlsx, .xls, or .csv</span>
                </div>
              </div>
            )}

            {uploadStatus === 'checking' && (
              <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2 py-8">
                <Loader2 size={28} className="animate-spin text-emerald-600" aria-hidden />
                <p className="text-sm font-medium text-gray-600">Reading file…</p>
              </div>
            )}

            {parsedData.length > 0 && uploadStatus === 'idle' && (
              <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4 text-center">
                  <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                    <Check size={20} strokeWidth={2.5} aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-emerald-950">
                    {parsedData.length} row{parsedData.length === 1 ? '' : 's'} ready
                  </p>
                  <button
                    type="button"
                    onClick={executeBulkImport}
                    disabled={!selectedRoleId || !selectedUnitId}
                    className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Import users
                  </button>
                  {(!selectedRoleId || !selectedUnitId) && (
                    <p className="mt-2 flex items-center justify-center gap-1 text-xs text-rose-600">
                      <AlertCircle size={14} aria-hidden />
                      Choose branch and role first.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setParsedData([])}
                  className="text-center text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  Clear file
                </button>
              </div>
            )}

            {(uploadStatus === 'uploading' || uploadStatus === 'success') && (
              <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
                  <span className="text-xs font-medium text-gray-600">Import log</span>
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
                      Import another file
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

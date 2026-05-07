/**
 * Stable Super Admin detection for JWT / Redux User (handles stale `role` vs `user_type`).
 * Backend `loginService` grants Super Admins **all** permission names + `MANAGE_TENANTS` / `MANAGE_SYSTEM`
 * (tenant role builders never assign both to org-scoped admins — see permissionTiers.SUPERADMIN_ONLY).
 */

import type { User } from '../types';

const TENANT_ADMIN_TYPES = new Set(['ORG_ADMIN', 'UNIT_ADMIN', 'DEPT_ADMIN']);
const ADMIN_PORTAL_PERMISSIONS = [
  'VIEW_REPORTS',
  'MANAGE_USERS',
  'IMPORT_USERS',
  'MANAGE_CAMPAIGNS',
  'MANAGE_HIERARCHY',
  'MANAGE_ROLES',
  'MANAGE_PERMISSIONS',
  'MANAGE_DEPARTMENTS',
  'MANAGE_TERMINOLOGY',
  'MANAGE_CHALLENGES',
  'MANAGE_EXAMS',
] as const;

/** @returns uppercase trimmed user_type token, or undefined */
export function normalizeUserTypeKey(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const compact = normalized.replace(/_/g, '');
  if (compact === 'SUPERADMIN') return 'SUPERADMIN';
  if (compact === 'ORGADMIN') return 'ORG_ADMIN';
  if (compact === 'UNITADMIN') return 'UNIT_ADMIN';
  if (compact === 'DEPTADMIN' || compact === 'DEPARTMENTADMIN') return 'DEPT_ADMIN';
  return normalized;
}

/** @returns lowercase normalized app role, or undefined for unknown values */
function normalizeRoleKey(raw: unknown): 'user' | 'admin' | 'superadmin' | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  const compact = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (compact === 'superadmin') return 'superadmin';
  if (compact === 'admin') return 'admin';
  if (compact === 'user') return 'user';
  return undefined;
}

function extractPermissionNames(perms: unknown): string[] {
  if (!Array.isArray(perms)) return [];
  return perms
    .map((p) => {
      if (typeof p === 'string') return p;
      if (p && typeof p === 'object') {
        const o = p as Record<string, unknown>;
        if (typeof o.name === 'string') return o.name;
        if (typeof o.permission === 'string') return o.permission;
      }
      return '';
    })
    .filter((p): p is string => typeof p === 'string' && p.trim() !== '');
}

function hasAdminPortalPermissions(perms: unknown): boolean {
  const names = extractPermissionNames(perms);
  return names.some((p) => ADMIN_PORTAL_PERMISSIONS.includes(p as (typeof ADMIN_PORTAL_PERMISSIONS)[number]));
}


export function reconcileSessionUser(prev: User | null): User | null {
  if (!prev) return null;
  const nt = normalizeUserTypeKey(prev.user_type);
  const superByPerms = hasPlatformLeasePermissions(prev.permissions);
  const roleNorm = normalizeRoleKey(prev.role);

  let role: User['role'] = roleNorm ?? 'user';
  let user_type = prev.user_type;
  if (nt && user_type !== nt) {
    user_type = nt;
  }

  if (nt === 'SUPERADMIN' || superByPerms) {
    role = 'superadmin';
  } else if (nt && TENANT_ADMIN_TYPES.has(nt)) {
    role = 'admin';
  } else if (hasAdminPortalPermissions(prev.permissions)) {
    role = 'admin';
  }

  const next: User = { ...prev, role, user_type };
  if (next.role === prev.role && next.user_type === prev.user_type) return prev;
  return next;
}

function hasPlatformLeasePermissions(perms: unknown): boolean {
  const names = extractPermissionNames(perms);
  return names.includes('MANAGE_TENANTS') && names.includes('MANAGE_SYSTEM');
}

export function isSuperAdminUser(
  user: { role?: string; user_type?: unknown; permissions?: unknown; roleDisplayName?: unknown; role_display_name?: unknown } | null | undefined,
): boolean {
  if (!user) return false;
  if (normalizeRoleKey(user.role) === 'superadmin') return true;
  const t = normalizeUserTypeKey(user.user_type);
  if (t === 'SUPERADMIN') return true;
  const display = typeof user.roleDisplayName === 'string' ? user.roleDisplayName : user.role_display_name;
  if (typeof display === 'string' && display.toLowerCase().includes('super admin')) return true;
  if (hasPlatformLeasePermissions(user.permissions)) return true;
  return false;
}

/** Used by ProtectedRoute wrapping `/admin/*`: tenant admins have `role` admin; Super Admin has superadmin or platform signals */
export function canAccessAdminPortal(
  user: { role?: string; user_type?: unknown; permissions?: unknown; roleDisplayName?: unknown; role_display_name?: unknown } | null | undefined,
): boolean {
  if (!user) return false;
  const role = normalizeRoleKey(user.role);
  if (role === 'admin' || role === 'superadmin') return true;
  const t = normalizeUserTypeKey(user.user_type);
  if (t && TENANT_ADMIN_TYPES.has(t)) return true;
  const display = typeof user.roleDisplayName === 'string' ? user.roleDisplayName : user.role_display_name;
  if (typeof display === 'string' && display.toLowerCase().includes('admin')) return true;
  if (hasAdminPortalPermissions(user.permissions)) return true;
  return isSuperAdminUser(user);
}

/**
 * RTK login `unwrap()` returns the parsed JSON body. Backends vary:
 * flat `{ token, user, permissions }`,
 * `{ success, data: { token, user, permissions } }`,
 * mixed fields on root + `data` (proxies sometimes split keys).
 */
export function unwrapLoginApiResult(result: unknown): {
  token?: string;
  message?: string;
  user?: Record<string, unknown>;
  permissions?: string[];
} {
  if (!result || typeof result !== 'object') return {};
  const root = result as Record<string, unknown>;
  const nested =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : {};
  const merged = { ...root, ...nested };

  const token = typeof merged.token === 'string' ? merged.token : undefined;
  const message =
    typeof merged.message === 'string'
      ? merged.message
      : typeof root.message === 'string'
        ? root.message
        : undefined;

  const userRaw = merged.user;
  const user =
    userRaw && typeof userRaw === 'object' ? (userRaw as Record<string, unknown>) : undefined;

  const permsMerged = merged.permissions;
  let permissions: string[] | undefined =
    Array.isArray(permsMerged) ? (permsMerged.filter((x) => typeof x === 'string') as string[]) : undefined;
  if (!permissions?.length && Array.isArray(root.permissions)) {
    permissions = root.permissions.filter((x): x is string => typeof x === 'string');
  }

  return { token, message, user, permissions };
}

/** Normalize `user_type` from API user blob (camelCase / alternate keys). */
export function pickUserTypeFromLoginBlob(u: Record<string, unknown>): string | undefined {
  const a = u.user_type;
  const b = u.userType;
  if (typeof a === 'string' && a.trim() !== '') return a;
  if (typeof b === 'string' && b.trim() !== '') return b;
  return undefined;
}

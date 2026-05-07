import { useMemo } from 'react';
import type { User } from '../types';

export type ReportUsersQueryArg = string | { org_id: string; dept_id?: string; unit_id?: string } | undefined;

export type ChallengesScopeArg =
  | { org_id: string; dept_id?: string }
  | undefined;

export type ReportScopeKind = 'dept' | 'unit' | 'org' | 'super' | 'directory';

export function useReportScopeArgs(currentUser: User) {
  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.user_type === 'SUPERADMIN';
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN';
  const isUnitAdmin = currentUser.user_type === 'UNIT_ADMIN';
  const isDeptAdmin =
    currentUser.user_type === 'DEPT_ADMIN' ||
    (currentUser.role === 'admin' &&
      !!currentUser.deptId &&
      (currentUser.user_type == null || currentUser.user_type === ''));

  const usersQueryArg: ReportUsersQueryArg = useMemo(() => {
    if (isDeptAdmin) {
      if (currentUser.orgId && currentUser.deptId) {
        return { org_id: currentUser.orgId, dept_id: currentUser.deptId };
      }
      return undefined;
    }
    if (isUnitAdmin) {
      if (currentUser.orgId && currentUser.unitId) {
        return { org_id: currentUser.orgId, unit_id: currentUser.unitId };
      }
      return undefined;
    }
    if (isOrgAdmin && currentUser.orgId) {
      return currentUser.orgId;
    }
    if (isSuperAdmin) {
      return undefined;
    }
    if (currentUser.orgId) {
      return currentUser.orgId;
    }
    return undefined;
  }, [
    isDeptAdmin,
    isOrgAdmin,
    isUnitAdmin,
    isSuperAdmin,
    currentUser.orgId,
    currentUser.deptId,
    currentUser.unitId,
  ]);

  const skipUsersQuery = isDeptAdmin
    ? !currentUser.orgId || !currentUser.deptId
    : isUnitAdmin
      ? !currentUser.orgId || !currentUser.unitId
      : !isSuperAdmin && !currentUser.orgId;

  const challengesQueryArg: ChallengesScopeArg = useMemo(() => {
    if (isSuperAdmin) {
      if (currentUser.orgId) {
        const q: { org_id: string; dept_id?: string } = { org_id: currentUser.orgId };
        if (currentUser.deptId) q.dept_id = currentUser.deptId;
        return q;
      }
      return undefined;
    }
    if (!currentUser.orgId) return undefined;
    const q: { org_id: string; dept_id?: string } = { org_id: currentUser.orgId };
    if (isDeptAdmin && currentUser.deptId) q.dept_id = currentUser.deptId;
    return q;
  }, [isSuperAdmin, isDeptAdmin, currentUser.orgId, currentUser.deptId]);

  /** Query string params for GET /gamification/training-summary (superadmin optional filters only). */
  const trainingSummaryQueryArg = useMemo(() => {
    if (!isSuperAdmin) return {};
    const q: Record<string, string> = {};
    if (currentUser.orgId) q.org_id = currentUser.orgId;
    if (currentUser.deptId) q.dept_id = currentUser.deptId;
    if (currentUser.unitId) q.unit_id = currentUser.unitId;
    return q;
  }, [isSuperAdmin, currentUser.orgId, currentUser.deptId, currentUser.unitId]);

  const scopeKind: ReportScopeKind = isDeptAdmin
    ? 'dept'
    : isUnitAdmin
      ? 'unit'
      : isOrgAdmin
        ? 'org'
        : isSuperAdmin
          ? 'super'
          : 'directory';

  return {
    isSuperAdmin,
    isOrgAdmin,
    isDeptAdmin,
    isUnitAdmin,
    usersQueryArg,
    skipUsersQuery,
    challengesQueryArg,
    trainingSummaryQueryArg,
    scopeKind,
  };
}

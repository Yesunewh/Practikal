/**
 * Canonical baseline names (sync with `backend/src/config/systemBaselineRoles.js`).
 * Includes legacy names so badges/sort stay correct until permission sync renames DB rows.
 */
export const BASELINE_SYSTEM_ROLE_NAMES = [
  'Learner',
  'Organization Admin',
  'Branch Admin',
  'Department Admin',
  'Super Admin',
] as const;

/** Pre-rename names still returned until `migrateLegacyBaselineRoleNames` runs on the server. */
const LEGACY_BASELINE_NAME_TO_ORDER: Record<string, number> = {
  'Default Learner': 0,
  Learner: 0,
  'Organization Admin (baseline)': 1,
  'Organization Admin': 1,
  'Branch / Unit Admin (baseline)': 2,
  'Branch Admin': 2,
  'Department Admin (baseline)': 3,
  'Department Admin': 3,
  'Super Admin': 4,
};

export function baselineRoleSortKey(name: string): number {
  const i = LEGACY_BASELINE_NAME_TO_ORDER[name];
  return i !== undefined ? i : BASELINE_SYSTEM_ROLE_NAMES.length;
}

export function isBaselineSystemRole(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(LEGACY_BASELINE_NAME_TO_ORDER, name);
}

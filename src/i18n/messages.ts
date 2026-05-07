import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';
import type { ReportScopeKind } from '../hooks/useReportScopeArgs';

export const LOCALES = ['en', 'am', 'om'] as const;
export type Locale = (typeof LOCALES)[number];

export type Messages = typeof en;

const bundles: Record<Locale, Messages> = {
  en,
  am: am as Messages,
  om: om as Messages,
};

export function getMessages(locale: Locale): Messages {
  return bundles[locale] ?? en;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Replace `{key}` placeholders in a string (e.g. from JSON). */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function reportScopeSubtitle(kind: ReportScopeKind, m: Messages['admin']): string {
  switch (kind) {
    case 'dept':
      return m.scopeDept;
    case 'unit':
      return m.scopeUnit;
    case 'org':
      return m.scopeOrg;
    case 'super':
      return m.scopeSuper;
    case 'directory':
      return m.scopeDirectory;
    default:
      return m.scopeDirectory;
  }
}

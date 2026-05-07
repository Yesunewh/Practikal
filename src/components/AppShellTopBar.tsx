import { ChevronDown, Menu, Shield, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { interpolate, isLocale, LOCALES, type Locale } from '../i18n/messages';

export type AppShellTopBarProps = {
  onOpenMobileNav: () => void;
  onToggleSidebarCollapse: () => void;
  sidebarCollapsed: boolean;
  /** e.g. "Dashboard" */
  title: string;
  userName: string;
  /** Department · organization when both exist (from DB-backed session). */
  userSubtitle: string;
  userInitial: string;
  xp: number;
  levelLabel: string;
  onProfileClick: () => void;
};

/**
 * Sticky app header — light surface with emerald accents to match learning pages (e.g. Challenges).
 */
export function AppShellTopBar({
  onOpenMobileNav,
  onToggleSidebarCollapse,
  sidebarCollapsed,
  title,
  userName,
  userSubtitle,
  userInitial,
  xp,
  levelLabel,
  onProfileClick,
}: AppShellTopBarProps) {
  const { locale, setLocale, messages } = useI18n();
  const c = messages.common;

  const localeTitle: Record<Locale, string> = {
    en: 'English',
    am: 'አማርኛ',
    om: 'Afaan Oromoo',
  };

  return (
    <header
      className="sticky top-0 z-[60] flex min-h-[3rem] shrink-0 items-center gap-1 border-b border-emerald-100/90 bg-gradient-to-b from-white via-emerald-50/35 to-white px-2 py-2 shadow-[0_1px_0_0_rgba(16,185,129,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:gap-3 sm:px-4 relative overflow-visible"
      style={{ paddingTop: 'max(0.2rem, env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-[70] hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white border border-emerald-100 text-emerald-600 shadow-md transition-all hover:scale-110 hover:bg-emerald-50 active:scale-95"
          onClick={onToggleSidebarCollapse}
          aria-label={sidebarCollapsed ? c.expandSidebar : c.collapseSidebar}
          title={sidebarCollapsed ? c.expandSidebar : c.collapseSidebar}
        >
          {sidebarCollapsed ? (
            <PanelLeft size={18} strokeWidth={2.5} />
          ) : (
            <PanelLeftClose size={18} strokeWidth={2.5} />
          )}
        </button>

        <button
          type="button"
          className="rounded-lg p-1 text-emerald-900/90 hover:bg-emerald-100/60 md:hidden ml-2"
          onClick={onOpenMobileNav}
          aria-label={c.openMenu}
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <div className="min-w-0 flex-1 py-0.5 pl-8">
          <h1 className="truncate text-base font-semibold leading-tight text-gray-900 sm:text-lg">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className="hidden flex-col items-end text-right leading-tight lg:flex"
          title={`${interpolate(c.xpCount, { n: xp.toLocaleString() })} — ${levelLabel}`}
        >
          <span className="text-xs font-semibold tabular-nums text-emerald-900">
            {interpolate(c.xpCount, { n: xp.toLocaleString() })}
          </span>
          <span className="max-w-[8rem] truncate text-[10px] capitalize text-emerald-800/70">
            {levelLabel}
          </span>
        </div>

        <div className="relative h-8 shrink-0 border-l border-emerald-100/80 pl-2 sm:pl-3">
          <label htmlFor="app-language-select" className="sr-only">
            {c.language}
          </label>
          <select
            id="app-language-select"
            value={locale}
            title={`${localeTitle[locale]} (${locale})`}
            onChange={(e) => {
              const v = e.target.value;
              if (isLocale(v)) setLocale(v);
            }}
            className="h-8 max-w-[3.875rem] cursor-pointer appearance-none rounded-lg border border-emerald-200/90 bg-white py-px pl-2 pr-6 text-[10px] font-semibold uppercase tracking-wide text-emerald-950 shadow-sm hover:border-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 sm:h-8 sm:max-w-[4rem] sm:text-[11px]"
          >
            {LOCALES.map((code) => (
              <option key={code} value={code} title={localeTitle[code]}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/75"
            strokeWidth={2}
            aria-hidden
          />
        </div>

        <button
          type="button"
          onClick={onProfileClick}
          className="flex max-w-[11rem] items-center gap-2 rounded-xl border border-emerald-100/90 bg-white/80 px-2 py-1.5 text-left shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/50 sm:max-w-[14rem] sm:px-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
            {userInitial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-900">
              {userName}
            </span>
            <span className="hidden truncate text-[11px] text-gray-600 sm:block">
              {userSubtitle || c.dash}
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}

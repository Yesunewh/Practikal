import { useEffect, useRef, useState } from 'react';
import { Bell, Menu, PanelLeftClose, PanelLeft, Shield } from 'lucide-react';

export type AppShellTopBarProps = {
  onOpenMobileNav: () => void;
  onToggleSidebarCollapse: () => void;
  sidebarCollapsed: boolean;
  /** e.g. "Dashboard" */
  title: string;
  userName: string;
  userOrg: string;
  userInitial: string;
  xp: number;
  levelLabel: string;
  onProfileClick: () => void;
  /**
   * When set (e.g. on `/admin` routes), shows a compact notifications control next to the profile.
   * Demo badge count until a real notifications API exists.
   */
  adminNotificationCount?: number;
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
  userOrg,
  userInitial,
  xp,
  levelLabel,
  onProfileClick,
  adminNotificationCount,
}: AppShellTopBarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationsOpen) return;
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [notificationsOpen]);

  const showAdminNotifs = typeof adminNotificationCount === 'number';

  return (
    <header
      className="sticky top-0 z-20 flex min-h-[3.25rem] shrink-0 items-center gap-2 border-b border-emerald-100/90 bg-gradient-to-b from-white via-emerald-50/35 to-white px-2 py-2 shadow-[0_1px_0_0_rgba(16,185,129,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:gap-3 sm:px-4"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-emerald-900/90 hover:bg-emerald-100/60 md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <button
          type="button"
          className="hidden rounded-lg p-2 text-emerald-900/85 hover:bg-emerald-100/60 md:inline-flex"
          onClick={onToggleSidebarCollapse}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeft size={22} strokeWidth={2} /> : <PanelLeftClose size={22} strokeWidth={2} />}
        </button>

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <Shield className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
          <span className="truncate font-semibold tracking-tight text-emerald-950">Practikal</span>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-emerald-200/80 sm:block" aria-hidden />

        <div className="min-w-0 flex-1 py-0.5">
          <h1 className="truncate text-base font-semibold leading-tight text-gray-900 sm:text-lg">{title}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden flex-col items-end text-right leading-tight lg:flex">
          <span className="text-xs font-medium tabular-nums text-emerald-900">{xp.toLocaleString()} XP</span>
          <span className="max-w-[8rem] truncate text-[10px] capitalize text-emerald-800/70">{levelLabel}</span>
        </div>

        {showAdminNotifs && (
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="relative rounded-lg p-2 text-emerald-900/85 transition-colors hover:bg-emerald-100/60"
              onClick={() => setNotificationsOpen((o) => !o)}
              aria-expanded={notificationsOpen}
              aria-haspopup="true"
              aria-label="Admin notifications"
            >
              <Bell size={20} strokeWidth={2} className="text-emerald-800/90" />
              {adminNotificationCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white">
                  {adminNotificationCount > 9 ? '9+' : adminNotificationCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 z-50 mt-1.5 w-[min(100vw-1rem,20rem)] rounded-xl border border-emerald-100/90 bg-white py-2 text-left shadow-lg shadow-emerald-900/10">
                <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-800">
                  Notifications
                </div>
                <div className="max-h-56 space-y-2 overflow-y-auto px-3 py-2 text-xs text-gray-600">
                  <p>New user registration pending review.</p>
                  <p>Assignment &quot;Password Security Basics&quot; due in 3 days for 12 users.</p>
                  <p className="text-[10px] text-gray-400">Connect a backend to deliver real notifications.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onProfileClick}
          className="flex max-w-[11rem] items-center gap-2 rounded-xl border border-emerald-100/90 bg-white/80 px-2 py-1.5 text-left shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/50 sm:max-w-[14rem] sm:px-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
            {userInitial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-900">{userName}</span>
            <span className="hidden truncate text-[11px] text-gray-600 sm:block">{userOrg || '—'}</span>
          </span>
        </button>
      </div>
    </header>
  );
}

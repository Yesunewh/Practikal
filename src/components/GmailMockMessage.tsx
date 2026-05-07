import type { ReactNode } from 'react';
import {
  AlertOctagon,
  Archive,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  FolderInput,
  Keyboard,
  MoreHorizontal,
  Printer,
  Reply,
  Search,
  Star,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';

export interface GmailMockMessageProps {
  fromLine?: string;
  subjectLine?: string;
  body: string;
  /** Shown on the red Gmail chip; default Gmail */
  clientBrand?: string;
  /** Crest + “MY UNIVERSITY” block under the body (reference template). */
  institutionFooter?: boolean;
}

function parseFrom(line: string | undefined): { name: string; email: string } {
  const raw = (line ?? '').trim();
  if (!raw) return { name: 'Unknown', email: '' };
  const angle = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (angle) {
    return { name: angle[1].replace(/^["']|["']$/g, '').trim(), email: angle[2].trim() };
  }
  if (raw.includes('@')) {
    return { name: raw, email: '' };
  }
  return { name: raw, email: '' };
}

/** Multi-color “Google” wordmark (compact). */
function GoogleWordmark() {
  return (
    <span className="inline-flex select-none items-baseline text-[1.35rem] font-medium tracking-tight">
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC04]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
    </span>
  );
}

/** Stylized crest: globe + book + wreath + MY UNIVERSITY (training mock). */
function UniversityInstitutionFooter() {
  return (
    <div className="mt-8 flex items-end gap-3 border-t border-transparent pt-4">
      <div className="shrink-0" aria-hidden>
        <svg width="56" height="64" viewBox="0 0 56 64" className="text-[#1a56c4]">
          <path
            fill="currentColor"
            opacity="0.35"
            d="M8 44c4-8 10-14 20-14s16 6 20 14c-4 6-10 10-20 10S12 50 8 44z"
          />
          <circle cx="28" cy="26" r="14" fill="#e8f1fc" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="28" cy="26" rx="14" ry="5.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          <path
            fill="currentColor"
            d="M18 20c2.5-4 6-6 10-6s7.5 2 10 6l-10 8-10-8z"
            opacity="0.9"
          />
          <rect x="22" y="14" width="12" height="8" rx="0.5" fill="#fff" stroke="currentColor" strokeWidth="1" />
          <path fill="currentColor" d="M25 14h6v2h-6v-2zm0 3h6v1h-6v-1z" opacity="0.4" />
        </svg>
      </div>
      <p className="pb-1 font-sans text-sm font-bold uppercase tracking-wide text-[#1a56c4]">MY UNIVERSITY</p>
    </div>
  );
}

function BodyContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const urlLike =
    /^(https?:\/\/\S+|www\.\S+|[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:\/\S*)?)$/i;

  return (
    <div
      className="space-y-3 break-words text-sm leading-[1.6] text-[#222222] sm:text-[15px]"
      style={{ fontFamily: "Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      {lines.map((line, i) => {
        const t = line.trim();
        if (urlLike.test(t)) {
          const href = t.startsWith('http') ? t : t.startsWith('www.') ? `https://${t}` : `https://${t}`;
          return (
            <a
              key={i}
              href={href}
              className="break-all text-[#1155CC] underline decoration-[#1155CC]/50 underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.preventDefault()}
            >
              {line}
            </a>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {line || '\u00a0'}
          </p>
        );
      })}
    </div>
  );
}

function ToolbarIcon({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="shrink-0 rounded-full p-1.5 text-neutral-600 transition hover:bg-neutral-100 sm:p-2"
      tabIndex={-1}
      aria-hidden
    >
      {children}
    </button>
  );
}

/**
 * Training-only Gmail web UI mock aligned with classic message view (not a real client).
 */
export default function GmailMockMessage({
  fromLine,
  subjectLine,
  body,
  clientBrand,
  institutionFooter = false,
}: GmailMockMessageProps) {
  const brand = clientBrand?.trim() || 'Gmail';
  const { name, email } = parseFrom(fromLine);
  const subject = subjectLine?.trim() || '(no subject)';
  const displayEmail = email;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-h-[min(62dvh,520px)] flex-col overflow-hidden rounded-lg border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] sm:max-h-[min(72dvh,560px)]">
      {/* Google strip + search (reference layout) */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-2 py-2 sm:px-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="shrink-0 pl-0.5">
            <GoogleWordmark />
          </div>
          <div className="flex min-h-[44px] min-w-0 flex-1 items-center rounded-full bg-[#f1f3f4] px-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            <Search className="mr-2 h-[18px] w-[18px] shrink-0 text-[#5f6368]" strokeWidth={2} />
            <span className="truncate text-[15px] text-[#5f6368]">Search mail</span>
            <span className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white">
              <Search className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </div>
          <div
            className="hidden h-9 w-9 shrink-0 rounded-full bg-[#7b1fa2] sm:flex sm:items-center sm:justify-center sm:text-xs sm:font-medium sm:text-white"
            aria-hidden
          >
            A
          </div>
        </div>
      </div>

      {/* Gmail toolbar */}
      <div className="flex shrink-0 items-center gap-1 border-b border-neutral-200 bg-white py-1.5 pl-1 pr-0 sm:gap-2 sm:px-2 sm:pr-2">
        <button
          type="button"
          className="flex shrink-0 items-center gap-0.5 rounded-md bg-[#c5221f] px-2 py-1.5 text-[11px] font-medium text-white shadow-sm sm:text-xs"
          tabIndex={-1}
          aria-hidden
        >
          <span className="max-w-[4.5rem] truncate sm:max-w-none">{brand}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.5} />
        </button>
        <div className="flex min-h-[40px] min-w-0 flex-1 items-center overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-0 pr-1 sm:gap-0.5 sm:pr-0">
            <ToolbarIcon>
              <ChevronLeft className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={2} />
            </ToolbarIcon>
            <ToolbarIcon>
              <Archive className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
            <ToolbarIcon>
              <AlertOctagon className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
            <ToolbarIcon>
              <Trash2 className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
            <ToolbarIcon>
              <FolderInput className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
            <ToolbarIcon>
              <Tag className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
            <span className="hidden shrink-0 px-1 text-xs text-neutral-500 sm:inline">1–50 of 50</span>
            <ToolbarIcon>
              <Keyboard className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
            <ToolbarIcon>
              <MoreHorizontal className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
          </div>
        </div>
      </div>

      {/* Subject + important marker + Inbox + actions */}
      <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 xl:px-8">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
          <h3 className="min-w-0 flex-1 break-words text-[1.05rem] font-normal leading-snug text-neutral-900 sm:text-[1.375rem]">
            {subject}
          </h3>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <span
              className="inline-flex items-center rounded border border-amber-400/80 bg-amber-100/90 px-1 py-0.5 text-amber-900 shadow-sm"
              title="Important"
              aria-hidden
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" strokeWidth={2.5} />
            </span>
            <span className="inline-flex items-center gap-0.5 rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
              Inbox
              <button type="button" className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200/80" tabIndex={-1} aria-hidden>
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
            <ToolbarIcon>
              <Printer className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
            <ToolbarIcon>
              <ExternalLink className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
          </div>
        </div>
      </div>

      {/* Sender */}
      <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 xl:px-8">
        <div className="flex gap-2 sm:gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0e0e0] text-[#757575] sm:h-10 sm:w-10"
            aria-hidden
          >
            <User className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="break-all text-sm font-semibold text-neutral-900 sm:text-base">{name}</span>
                {displayEmail ? (
                  <span className="break-all text-xs text-neutral-600 sm:text-sm">&lt;{displayEmail}&gt;</span>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex w-fit max-w-full items-center gap-0.5 truncate text-left text-xs text-neutral-600 hover:underline"
                tabIndex={-1}
              >
                to me
                <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end text-xs text-neutral-500">
            <span className="whitespace-nowrap">12:18 PM</span>
            <span className="hidden text-[11px] sm:inline">(50 minutes ago)</span>
          </div>
        </div>
        <div className="mt-2 flex justify-start gap-0.5 border-t border-transparent pt-1 pl-11 sm:mt-1 sm:pl-[3.25rem]">
          <button type="button" className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 sm:p-2" tabIndex={-1} aria-hidden>
            <Star className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
          </button>
          <button type="button" className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 sm:p-2" tabIndex={-1} aria-hidden>
            <Reply className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
          </button>
          <button type="button" className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 sm:p-2" tabIndex={-1} aria-hidden>
            <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white px-3 py-3 sm:px-6 sm:py-5 lg:px-8 xl:px-10">
        {body.trim() ? (
          <>
            <BodyContent text={body} />
            {institutionFooter ? <UniversityInstitutionFooter /> : null}
          </>
        ) : (
          <p className="text-sm italic text-neutral-400">—</p>
        )}
      </div>

      <div className="shrink-0 border-t border-neutral-100 bg-neutral-50 px-2 py-1.5 text-center text-[10px] leading-snug text-neutral-400 sm:px-3 sm:py-2 sm:text-xs">
        <span className="hidden sm:inline">Simulated inbox for training — not connected to {brand}</span>
        <span className="sm:hidden">Training simulation — not real {brand}</span>
      </div>
    </div>
  );
}

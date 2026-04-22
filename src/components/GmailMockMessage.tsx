import type { ReactNode } from 'react';
import {
  AlertOctagon,
  Archive,
  ChevronDown,
  ChevronLeft,
  FolderInput,
  Keyboard,
  MoreHorizontal,
  Reply,
  Settings,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';

export interface GmailMockMessageProps {
  fromLine?: string;
  subjectLine?: string;
  body: string;
  /** Shown in chrome; default Gmail */
  clientBrand?: string;
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

function BodyContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const urlLike = /^(https?:\/\/\S+|www\.\S+|[a-z0-9.-]+\.[a-z]{2,}\/\S*)$/i;

  return (
    <div className="space-y-3 break-words font-[system-ui,'Segoe_UI',Roboto,Arial,sans-serif] text-sm leading-[1.6] text-neutral-800 sm:text-[15px]">
      {lines.map((line, i) => {
        const t = line.trim();
        if (urlLike.test(t)) {
          const href = t.startsWith('http') ? t : `https://${t}`;
          return (
            <a
              key={i}
              href={href}
              className="break-all text-[#1a73e8] underline decoration-[#1a73e8]/40 underline-offset-2"
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
 * Training-only Gmail-style chrome for binary-verdict steps (not a real mail client).
 */
export default function GmailMockMessage({ fromLine, subjectLine, body, clientBrand }: GmailMockMessageProps) {
  const brand = clientBrand?.trim() || 'Gmail';
  const { name, email } = parseFrom(fromLine);
  const subject = subjectLine?.trim() || '(no subject)';
  const displayEmail = email;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-h-[min(62dvh,520px)] flex-col overflow-hidden rounded-lg border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] sm:max-h-[min(72dvh,560px)]">
      {/* Gmail toolbar — horizontal scroll on narrow viewports */}
      <div className="flex items-center gap-1 border-b border-neutral-200 bg-white py-1.5 pl-1 pr-0 sm:gap-2 sm:px-2 sm:pr-2">
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
              <Settings className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={1.75} />
            </ToolbarIcon>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className="border-b border-neutral-100 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 xl:px-8">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5">
          <h3 className="min-w-0 flex-1 break-words text-lg font-normal leading-snug text-neutral-900 sm:text-[22px]">
            {subject}
          </h3>
          <span className="inline-flex shrink-0 items-center rounded border border-amber-300/90 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-950">
            Inbox
          </span>
        </div>
      </div>

      {/* Sender row */}
      <div className="border-b border-neutral-100 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 xl:px-8">
        <div className="flex gap-2 sm:gap-3">
          <div
            className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400 sm:h-10 sm:w-10"
            aria-hidden
          />
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
            <span className="hidden text-[11px] sm:inline">(50 min ago)</span>
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
          <BodyContent text={body} />
        ) : (
          <p className="text-sm italic text-neutral-400">—</p>
        )}
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50 px-2 py-1.5 text-center text-[10px] leading-snug text-neutral-400 sm:px-3 sm:py-2 sm:text-xs">
        <span className="hidden sm:inline">Simulated inbox for training — not connected to {brand}</span>
        <span className="sm:hidden">Training simulation — not real {brand}</span>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import {
  ChevronLeft,
  Mic,
  MoreVertical,
  Paperclip,
  Pin,
} from 'lucide-react';

export interface TelegramMockMessageProps {
  fromLine?: string;
  subjectLine?: string;
  body: string;
  showOwnerBadge?: boolean;
  replyQuote?: { author: string; preview: string };
}

/** Pastel green + faint white doodles (Telegram-style wallpaper). */
const DOODLE_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <g fill="none" stroke="rgba(255,255,255,0.38)" stroke-width="1.1" stroke-linecap="round">
      <path d="M10 18c3 4 8-2 12 2"/><circle cx="48" cy="14" r="2.2"/>
      <path d="M72 22l6-3"/><circle cx="88" cy="28" r="1.4"/><path d="M18 42h10v6H18z"/>
      <path d="M38 52c6 0 6 8 0 8"/><circle cx="62" cy="58" r="2"/><path d="M78 48l4 8"/>
      <circle cx="24" cy="72" r="1.6"/><path d="M44 78l8 4"/><path d="M70 82c4-6 10-2 8 4"/>
      <path d="M8 88l6-4"/><circle cx="92" cy="88" r="1.8"/>
    </g>
  </svg>`,
)}")`;

function tokenizeLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*.+?\*\*)|(https?:\/\/[^\s<]+[^\s.,;:!?'")\]]?)|(#[A-Za-z0-9_]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(line.slice(lastIndex, m.index));
    }
    const match = m[0];
    if (match.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="font-semibold text-neutral-900">
          {match.slice(2, -2)}
        </strong>,
      );
    } else if (match.startsWith('http')) {
      nodes.push(
        <a
          key={key++}
          href={match}
          className="break-all text-[#2481cc] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.preventDefault()}
        >
          {match}
        </a>,
      );
    } else if (match.startsWith('#')) {
      nodes.push(
        <span key={key++} className="font-medium text-[#2481cc]">
          {match}
        </span>,
      );
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }
  return nodes.length ? nodes : ['\u00a0'];
}

function BubbleBody({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-[15px] leading-[1.42] text-neutral-900">
      {lines.map((line, i) => (
        <p key={i} className="mb-1.5 whitespace-pre-wrap last:mb-0">
          {tokenizeLine(line)}
        </p>
      ))}
    </div>
  );
}

/**
 * Training-only Telegram mobile chat mock (DM-style thread), not a real client.
 */
export default function TelegramMockMessage({
  fromLine,
  subjectLine,
  body,
  showOwnerBadge = false,
  replyQuote,
}: TelegramMockMessageProps) {
  const name = (fromLine ?? '').trim() || 'Contact';
  const status = (subjectLine ?? '').trim() || 'online';
  const senderColor = '#2481cc';
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'E';

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const timeLabel = '8:05 AM';

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-h-[min(62dvh,520px)] flex-col overflow-hidden rounded-lg border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] sm:max-h-[min(72dvh,560px)]">
      {/* Top bar — white (mobile chat) */}
      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200/90 bg-white px-1.5 py-2 sm:px-2">
        <button type="button" className="rounded-full p-1.5 text-[#2481cc]" tabIndex={-1} aria-hidden>
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold leading-none text-emerald-400 ring-1 ring-neutral-300"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold leading-tight text-neutral-900">{name}</p>
          <p className="truncate text-[13px] text-neutral-500">{status}</p>
        </div>
        <button type="button" className="rounded-full p-2 text-neutral-500" tabIndex={-1} aria-hidden>
          <MoreVertical className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Pinned message strip */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#dfe8f2] bg-[#e8f1fa] px-2 py-1.5">
        <div className="h-9 w-9 shrink-0 rounded bg-neutral-300/80 ring-1 ring-black/5" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-tight text-[#2481cc]">Pinned Message</p>
          <p className="truncate text-[12px] text-neutral-500">Album</p>
        </div>
        <Pin className="h-4 w-4 shrink-0 text-[#2481cc]" strokeWidth={2} />
      </div>

      {/* Chat area */}
      <div
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          backgroundColor: '#b6d99c',
          backgroundImage: DOODLE_PATTERN,
          backgroundSize: '100px 100px',
        }}
      >
        <div className="flex flex-col px-2 py-3 pb-2">
          {/* Date chip */}
          <div className="mb-3 flex justify-center">
            <span className="rounded-full bg-black/22 px-3 py-1 text-[12px] font-medium text-white shadow-sm">
              {dateLabel}
            </span>
          </div>

          {/* Incoming message row (avatar = sender) */}
          <div className="flex items-end gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold leading-none text-emerald-400 shadow-sm ring-1 ring-white/70"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 max-w-[calc(100%-2.75rem)] flex-1">
              <div className="rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[14px] font-semibold" style={{ color: senderColor }}>
                    {name}
                  </span>
                  {showOwnerBadge ? (
                    <span className="rounded bg-[#9b59b6] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Owner
                    </span>
                  ) : null}
                </div>

                {replyQuote ? (
                  <div
                    className="mb-2 border-l-[3px] rounded-r-md py-1 pl-2"
                    style={{ borderColor: '#c45c4a', backgroundColor: 'rgba(0,0,0,0.04)' }}
                  >
                    <p className="text-[13px] font-semibold text-[#c45c4a]">{replyQuote.author}</p>
                    <p className="max-h-[2.75rem] overflow-hidden text-[13px] leading-snug text-neutral-600">
                      {replyQuote.preview}
                    </p>
                  </div>
                ) : null}

                {body.trim() ? (
                  <BubbleBody text={body} />
                ) : (
                  <p className="text-[15px] italic text-neutral-400">—</p>
                )}

                <div className="mt-1 flex justify-end">
                  <span className="text-[11px] tabular-nums text-neutral-400">{timeLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-2 py-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-indigo-300 ring-1 ring-neutral-200"
          aria-hidden
        />
        <div className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm">
          <span className="shrink-0 text-[13px] font-medium text-neutral-400">GIF</span>
          <span className="min-w-0 flex-1 truncate text-[15px] text-neutral-400">Message</span>
          <button type="button" className="shrink-0 p-1 text-neutral-400" tabIndex={-1} aria-hidden>
            <Paperclip className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3390ec] text-white shadow-md ring-1 ring-[#2b7fd4]"
          tabIndex={-1}
          aria-hidden
        >
          <Mic className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="shrink-0 border-t border-neutral-200/80 bg-neutral-50 px-2 py-1.5 text-center text-[10px] leading-snug text-neutral-500 sm:px-3 sm:py-2 sm:text-xs">
        <span className="hidden sm:inline">Simulated Telegram chat for training — not connected to Telegram</span>
        <span className="sm:hidden">Training simulation — not real Telegram</span>
      </div>
    </div>
  );
}

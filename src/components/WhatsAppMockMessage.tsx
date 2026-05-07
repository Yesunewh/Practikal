import { CheckCheck, MoreVertical, Phone, Video } from 'lucide-react';

export interface WhatsAppMockMessageProps {
  fromLine?: string;
  subjectLine?: string;
  body: string;
}

function BodyContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-[1.5] text-neutral-900 sm:text-[15px]">
      {lines.map((line, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {line || '\u00a0'}
        </p>
      ))}
    </div>
  );
}

/**
 * Training-only WhatsApp-style chrome for binary-verdict steps.
 */
export default function WhatsAppMockMessage({ fromLine, subjectLine, body }: WhatsAppMockMessageProps) {
  const contact = (fromLine ?? '').trim() || 'Unknown contact';
  const subtitle = (subjectLine ?? '').trim() || 'online';

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-h-[min(62dvh,520px)] flex-col overflow-hidden rounded-lg border border-neutral-200/90 bg-[#e5ddd5] shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] sm:max-h-[min(72dvh,560px)]">
      <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2.5 text-white sm:px-4">
        <div
          className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 ring-1 ring-white/30 sm:h-10 sm:w-10"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold sm:text-base">{contact}</p>
          <p className="truncate text-xs text-emerald-100">{subtitle}</p>
        </div>
        <button type="button" className="rounded-full p-1.5 text-emerald-100" tabIndex={-1} aria-hidden>
          <Video className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" className="rounded-full p-1.5 text-emerald-100" tabIndex={-1} aria-hidden>
          <Phone className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" className="rounded-full p-1.5 text-emerald-100" tabIndex={-1} aria-hidden>
          <MoreVertical className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#ece5dd] p-3 sm:p-4">
        <div className="mx-auto flex w-full max-w-[90%] justify-start">
          <div className="relative rounded-lg rounded-tl-sm bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5 sm:px-4 sm:py-3">
            {body.trim() ? (
              <BodyContent text={body} />
            ) : (
              <p className="text-sm italic text-neutral-400">—</p>
            )}
            <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-neutral-500">
              <span>12:18</span>
              <CheckCheck className="h-3.5 w-3.5 text-sky-500" strokeWidth={2.25} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-300/70 bg-[#f0f2f5] px-2 py-1.5 text-center text-[10px] leading-snug text-neutral-500 sm:px-3 sm:py-2 sm:text-xs">
        <span className="hidden sm:inline">Simulated chat for training - not connected to WhatsApp</span>
        <span className="sm:hidden">Training simulation - not real WhatsApp</span>
      </div>
    </div>
  );
}

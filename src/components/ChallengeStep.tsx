import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ChallengeStep as ChallengeStepType,
  QuestionContent,
  PasswordRequirements,
  InformationContent,
  ScenarioContent,
  SequentialContent,
  SequentialStep,
  ImageVerificationContent,
  SimulationContent,
  PhishingInboxContent,
  VideoCheckContent,
  PolicyAttestationContent,
  StepCompleteDetail,
  VerdictMessageChannel,
} from '../types';
import { RootState, AppDispatch } from '../store';
import { logActivity } from '../store/slices/progressSlice';
import GmailMockMessage from './GmailMockMessage';
import WhatsAppMockMessage from './WhatsAppMockMessage';
import TelegramMockMessage from './TelegramMockMessage';
import {
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Terminal,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';

function normalizeVerdictChannel(raw: unknown): VerdictMessageChannel {
  if (raw == null || raw === '') return 'gmail';
  const s = String(raw).trim().toLowerCase();
  if (s === 'whatsapp' || s === 'telegram') return s;
  return 'gmail';
}

function videoEmbedUrl(url: string): string {
  try {
    if (url.includes('youtube.com/watch')) {
      const v = new URL(url, 'https://www.youtube.com').searchParams.get('v');
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (url.includes('youtu.be/')) {
      const part = url.split('youtu.be/')[1]?.split(/[?&#]/)[0];
      if (part) return `https://www.youtube-nocookie.com/embed/${part}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}

interface ChallengeStepProps {
  step: ChallengeStepType;
  onComplete: (detail: StepCompleteDetail) => void;
  isLast: boolean;
  /** Full-width mint learner UI (centered title, 2-col cards, pill submit). */
  surface?: 'default' | 'challengeMint';
}

export default function ChallengeStep({
  step,
  onComplete,
  isLast,
  surface = 'default',
}: ChallengeStepProps) {
  if (!step) return null;

  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [sequentialOrder, setSequentialOrder] = useState<SequentialStep[]>([]);
  const [phishingClassifications, setPhishingClassifications] = useState<Record<string, 'phish' | 'safe'>>({});
  const [inboxSelectedId, setInboxSelectedId] = useState<string | null>(null);
  const [policyReadComplete, setPolicyReadComplete] = useState(false);
  const [policyAttestChecked, setPolicyAttestChecked] = useState(false);
  const policyScrollRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<StepCompleteDetail | null>(null);

  useEffect(() => {
    setSelectedOptions([]);
    setPassword('');
    setShowPassword(false);
    setShowExplanation(false);
    setIsAnswered(false);
    setCanContinue(false);
    setPhishingClassifications({});
    setPolicyReadComplete(false);
    setPolicyAttestChecked(false);
    resultRef.current = null;
    if (step.type === 'sequential') {
      const content = step.content as SequentialContent;
      setSequentialOrder([...content.steps].sort(() => Math.random() - 0.5));
    }
    if (step.type === 'phishing-inbox') {
      const content = step.content as PhishingInboxContent;
      setInboxSelectedId(content.emails[0]?.id ?? null);
    } else {
      setInboxSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset per step id only
  }, [step.id, step.type]);

  useEffect(() => {
    if (step.type !== 'policy-attestation' || isAnswered) return;
    const el = policyScrollRef.current;
    if (!el) return;
    const shortDoc = el.scrollHeight <= el.clientHeight + 8;
    if (shortDoc) setPolicyReadComplete(true);
  }, [step.id, step.type, isAnswered]);

  /** Binary verdict (mock message + left/right): ← → select first/second option when not answered */
  useEffect(() => {
    if (step.type !== 'question') return;
    const c = step.content as QuestionContent;
    if (c.questionKind !== 'binary_verdict' || isAnswered) return;
    if (c.options.length < 2) return;
    const leftId = c.options[0].id;
    const rightId = c.options[1].id;

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedOptions([leftId]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedOptions([rightId]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step.id, step.type, isAnswered]);

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    
    if (step.type === 'question' || step.type === 'scenario' || step.type === 'video-check') {
      const content = step.content as QuestionContent | ScenarioContent | VideoCheckContent;
      const qKind =
        step.type === 'question' ? (content as QuestionContent).questionKind ?? 'multiple_choice' : null;
      const forceSingleSelect =
        step.type === 'scenario' ||
        step.type === 'video-check' ||
        qKind === 'true_false' ||
        qKind === 'binary_verdict' ||
        (step.type === 'question' && !(content as QuestionContent).multipleAnswers);

      if ('multipleAnswers' in content && content.multipleAnswers && !forceSingleSelect) {
        setSelectedOptions((prev) =>
          prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
        );
      } else {
        setSelectedOptions([optionId]);
      }
    } else if (step.type === 'image-verification') {
      const content = step.content as ImageVerificationContent;
      if (content.multipleAnswers) {
        setSelectedOptions(prev => 
          prev.includes(optionId) 
            ? prev.filter(id => id !== optionId)
            : [...prev, optionId]
        );
      } else {
        setSelectedOptions([optionId]);
      }
    }
  };

  // Function to move a step up or down in the sequential list
  const moveStep = (id: string, direction: 'up' | 'down') => {
    if (isAnswered) return;
    
    setSequentialOrder(prev => {
      const index = prev.findIndex(step => step.id === id);
      if (index === -1) return prev;
      
      const newOrder = [...prev];
      if (direction === 'up' && index > 0) {
        // Swap with the item above
        [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      } else if (direction === 'down' && index < prev.length - 1) {
        // Swap with the item below
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      
      return newOrder;
    });
  };

  // Function to validate password against requirements
  const validatePassword = (password: string, requirements: PasswordRequirements) => {
    const hasLength = password.length >= requirements.minLength;
    const hasCapital = !requirements.requireCapital || /[A-Z]/.test(password);
    const hasNumber = !requirements.requireNumber || /[0-9]/.test(password);
    const hasSpecial = !requirements.requireSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasLength && hasCapital && hasNumber && hasSpecial;
  };

  const handleSubmit = () => {
    if (isAnswered) {
      if (resultRef.current) onComplete(resultRef.current);
      return;
    }

    let isCorrect = false;
    let answer: string | string[] = [];

    switch (step.type) {
      case 'question':
      case 'video-check': {
        const content = step.content as QuestionContent | VideoCheckContent;
        const correctAnswers = content.options.filter(opt => opt.isCorrect).map(opt => opt.id);
        isCorrect = correctAnswers.length === selectedOptions.length &&
          correctAnswers.every(id => selectedOptions.includes(id));
        answer = [...selectedOptions];
        break;
      }

      case 'scenario': {
        const content = step.content as ScenarioContent;
        const correctAnswer = content.options.find(opt => opt.isCorrect);
        isCorrect = correctAnswer ? selectedOptions.includes(correctAnswer.id) : false;
        answer = [...selectedOptions];
        break;
      }

      case 'sequential': {
        isCorrect = sequentialOrder.every((s, index) => s.correctPosition === index + 1);
        answer = sequentialOrder.map(s => s.id);
        break;
      }

      case 'image-verification': {
        const content = step.content as ImageVerificationContent;
        const correctImages = content.images.filter(img => img.isReal).map(img => img.id);
        if (content.multipleAnswers) {
          isCorrect = correctImages.length === selectedOptions.length &&
            correctImages.every(id => selectedOptions.includes(id));
        } else {
          isCorrect = content.images
            .find(img => img.id === selectedOptions[0])
            ?.isReal || false;
        }
        answer = [...selectedOptions];
        break;
      }
      case 'information':
        isCorrect = true;
        answer = ['acknowledged'];
        break;
      case 'password-create': {
        const content = step.content as PasswordRequirements;
        isCorrect = validatePassword(password, content);
        answer = ['[redacted]'];
        break;
      }
      case 'simulation':
        isCorrect = true;
        answer = ['reviewed'];
        break;
      case 'policy-attestation': {
        const pContent = step.content as PolicyAttestationContent;
        isCorrect = policyReadComplete && policyAttestChecked;
        answer = [`attested:${pContent.policyId}`];
        break;
      }
      case 'phishing-inbox': {
        const content = step.content as PhishingInboxContent;
        const allLabeled = content.emails.every(
          e => phishingClassifications[e.id] === 'phish' || phishingClassifications[e.id] === 'safe',
        );
        if (content.emails.length === 0) {
          isCorrect = true;
        } else if (!allLabeled) {
          isCorrect = false;
        } else {
          isCorrect = content.emails.every(e => {
            const v = phishingClassifications[e.id]!;
            return e.isPhishing ? v === 'phish' : v === 'safe';
          });
        }
        const map: Record<string, string> = {};
        for (const e of content.emails) {
          map[e.id] = phishingClassifications[e.id] ?? '';
        }
        answer = [JSON.stringify(map)];
        break;
      }
    }

    const detail: StepCompleteDetail = { stepId: step.id, correct: isCorrect, answer };
    resultRef.current = detail;
    if (step.type === 'policy-attestation' && isCorrect && user) {
      const c = step.content as PolicyAttestationContent;
      dispatch(logActivity({
        userId: user.id,
        type: 'policy_attested',
        details: { policyId: c.policyId, policyTitle: c.documentTitle },
      }));
    }
    setIsAnswered(true);
    setShowExplanation(true);
    setCanContinue(isCorrect);
  };

  const renderContent = () => {
    switch (step.type) {
      case 'information': {
        const content = step.content as InformationContent;
        return (
          <div className={surface === 'challengeMint' ? 'space-y-4 text-center' : 'space-y-4'}>
            <h3
              className={
                surface === 'challengeMint'
                  ? 'text-2xl font-semibold tracking-tight text-emerald-950'
                  : 'text-xl font-semibold'
              }
            >
              {content.title}
            </h3>
            <p className={surface === 'challengeMint' ? 'mx-auto max-w-xl text-neutral-700' : 'text-neutral-600'}>
              {content.description}
            </p>
            {content.image && (
              <img src={content.image} alt={content.title} className="rounded-lg w-full max-w-2xl mx-auto" />
            )}
          </div>
        );
      }

      case 'question': {
        const content = step.content as QuestionContent;
        const qKind = content.questionKind ?? 'multiple_choice';
        const ctx = content.verdictContext ?? {};
        const messageChannel = normalizeVerdictChannel(ctx.channel);

        const optionTile = (option: (typeof content.options)[0], compact?: boolean) => (
          <div
            key={option.id}
            role="button"
            tabIndex={0}
            onClick={() => handleOptionSelect(option.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOptionSelect(option.id);
              }
            }}
            className={`text-center rounded-2xl border-2 bg-white transition-colors tap-highlight ${
              compact ? 'p-4 text-sm font-semibold' : 'p-6 text-base font-semibold shadow-sm'
            } ${
              selectedOptions.includes(option.id)
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-neutral-200 hover:border-neutral-300'
            } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex flex-col items-center justify-center gap-2 min-h-[3rem]">
              <span className="text-neutral-900">{option.text}</span>
              {isAnswered &&
                (option.isCorrect ? (
                  <CheckCircle2 className="text-emerald-500" size={22} />
                ) : (
                  selectedOptions.includes(option.id) && <XCircle className="text-red-500" size={22} />
                ))}
            </div>
          </div>
        );

        const mintChoiceButton = (option: (typeof content.options)[0], multi: boolean) => {
          const selected = selectedOptions.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={isAnswered}
              onClick={() => handleOptionSelect(option.id)}
              className={`flex min-h-[4.5rem] w-full items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-all tap-highlight sm:min-h-[5rem] sm:p-5 ${
                selected ? 'border-emerald-500 ring-2 ring-emerald-500/25' : 'border-emerald-100 hover:border-emerald-300'
              } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  multi
                    ? selected
                      ? 'border-emerald-600 bg-emerald-600'
                      : 'border-neutral-300 bg-white'
                    : selected
                      ? 'border-emerald-600 bg-white'
                      : 'border-neutral-300 bg-white'
                }`}
                aria-hidden
              >
                {multi ? (
                  selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                ) : (
                  selected && <span className="block h-2.5 w-2.5 rounded-full bg-emerald-600" />
                )}
              </span>
              <span className="flex-1 text-sm font-medium leading-snug text-neutral-900 sm:text-base">
                {option.text}
              </span>
              {isAnswered &&
                (option.isCorrect ? (
                  <CheckCircle2 className="shrink-0 text-emerald-600" size={22} aria-hidden />
                ) : (
                  selected && <XCircle className="shrink-0 text-red-500" size={22} aria-hidden />
                ))}
            </button>
          );
        };

        /** Mint multiple-choice: list + letter badges (distinct from 2-up true/false tiles). */
        const mintMcqListOption = (option: (typeof content.options)[0], index: number, multi: boolean) => {
          const selected = selectedOptions.includes(option.id);
          const badge = multi ? String(index + 1) : String.fromCharCode(65 + index);
          return (
            <button
              key={option.id}
              type="button"
              disabled={isAnswered}
              onClick={() => handleOptionSelect(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left shadow-sm transition-all tap-highlight sm:gap-4 sm:px-4 sm:py-3.5 ${
                selected
                  ? 'border-emerald-600 bg-emerald-50/95 ring-2 ring-emerald-500/20'
                  : 'border-emerald-200/70 bg-white/90 hover:border-emerald-400 hover:bg-white'
              } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums ring-1 transition-colors sm:h-10 sm:w-10 ${
                  selected
                    ? 'bg-emerald-600 text-white ring-emerald-700/35'
                    : 'bg-emerald-100/90 text-emerald-900 ring-emerald-200/80'
                }`}
                aria-hidden
              >
                {badge}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-neutral-900 sm:text-base">
                {option.text}
              </span>
              {!multi && (
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-emerald-600 bg-white' : 'border-neutral-300 bg-white'
                  }`}
                  aria-hidden
                >
                  {selected && <span className="block h-2 w-2 rounded-full bg-emerald-600" />}
                </span>
              )}
              {multi && (
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    selected ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300 bg-white'
                  }`}
                  aria-hidden
                >
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
              )}
              {isAnswered &&
                (option.isCorrect ? (
                  <CheckCircle2 className="shrink-0 text-emerald-600" size={22} aria-hidden />
                ) : (
                  selected && <XCircle className="shrink-0 text-red-500" size={22} aria-hidden />
                ))}
            </button>
          );
        };

        const verdictCard = (
          <div className="flex min-h-[min(240px,45dvh)] min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden max-h-[min(62dvh,520px)] lg:max-h-[min(560px,72dvh)] lg:min-h-0">
            {messageChannel === 'whatsapp' ? (
              <WhatsAppMockMessage
                fromLine={ctx.fromLine}
                subjectLine={ctx.subjectLine}
                body={content.scenarioBody || ''}
              />
            ) : messageChannel === 'telegram' ? (
              <TelegramMockMessage
                fromLine={ctx.fromLine}
                subjectLine={ctx.subjectLine}
                body={content.scenarioBody || ''}
                showOwnerBadge={ctx.telegramShowOwnerBadge === true}
                replyQuote={
                  ctx.telegramQuoteAuthor?.trim() && ctx.telegramQuotePreview?.trim()
                    ? {
                        author: ctx.telegramQuoteAuthor.trim(),
                        preview: ctx.telegramQuotePreview.trim(),
                      }
                    : undefined
                }
              />
            ) : (
              <GmailMockMessage
                clientBrand={ctx.clientBrand}
                fromLine={ctx.fromLine}
                subjectLine={ctx.subjectLine}
                body={content.scenarioBody || ''}
                institutionFooter={ctx.institutionFooter === true}
              />
            )}
          </div>
        );

        const verdictBinaryButton = (
          option: (typeof content.options)[0],
          side: 'left' | 'right',
          compact: boolean,
        ) => {
          const selected = selectedOptions.includes(option.id);
          const isLeft = side === 'left';
          const idle = isLeft
            ? 'border-amber-300 bg-amber-50/95 text-amber-950 hover:border-amber-500 hover:bg-amber-100 active:scale-[0.98]'
            : 'border-emerald-200 bg-emerald-50/95 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-100 active:scale-[0.98]';
          const sel = isLeft
            ? 'border-amber-600 bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50 hover:bg-amber-600'
            : 'border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40 hover:bg-emerald-600';

          return (
            <button
              key={option.id}
              type="button"
              disabled={isAnswered}
              onClick={() => handleOptionSelect(option.id)}
              aria-pressed={selected}
              aria-label={option.text}
              className={`inline-flex w-full max-w-[10.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border-2 font-semibold transition-all duration-150 tap-highlight focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-default ${
                compact
                  ? 'px-2.5 py-2.5 text-xs sm:max-w-[11rem] sm:px-3 sm:py-3 sm:text-sm'
                  : 'px-3 py-3 text-sm shadow-sm'
              } ${selected ? sel : idle} ${isAnswered && !selected ? 'opacity-50' : ''} ${
                isLeft ? 'focus-visible:ring-amber-500' : 'focus-visible:ring-emerald-500'
              }`}
            >
              {isLeft ? (
                <ShieldAlert
                  className={`shrink-0 ${compact ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-6 w-6 sm:h-7 sm:w-7'}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : (
                <ShieldCheck
                  className={`shrink-0 ${compact ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-6 w-6 sm:h-7 sm:w-7'}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
              <span className="max-w-full text-center leading-snug [overflow-wrap:anywhere]">{option.text}</span>
              {isAnswered &&
                (option.isCorrect ? (
                  <CheckCircle2
                    className={selected ? 'text-white' : isLeft ? 'text-amber-700' : 'text-emerald-700'}
                    size={compact ? 18 : 20}
                    aria-hidden
                  />
                ) : (
                  selected && <XCircle className="text-white" size={compact ? 18 : 20} aria-hidden />
                ))}
            </button>
          );
        };

        if (qKind === 'binary_verdict' && content.options.length >= 2) {
          const [left, right] = content.options;
          return (
            <div className="w-full space-y-4 px-0 sm:space-y-5 sm:px-0">
              <h2 className="mx-auto max-h-[min(42dvh,16rem)] max-w-5xl overflow-y-auto text-center font-serif text-xl font-semibold leading-tight tracking-tight text-emerald-900 [overflow-wrap:anywhere] hyphens-auto sm:max-h-[min(38dvh,18rem)] sm:text-2xl md:text-3xl 2xl:max-w-6xl">
                {content.question}
              </h2>

              <p className="mx-auto max-w-4xl px-1 text-center text-[11px] leading-snug text-neutral-500 sm:text-xs md:max-w-5xl 2xl:max-w-6xl">
                <span className="hidden sm:inline">
                  Use{' '}
                  <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-700">←</kbd>{' '}
                  <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-700">→</kbd>{' '}
                  or tap —{' '}
                </span>
                <span className="sm:hidden">Tap — </span>
                <span className="text-neutral-600">
                  <span className="font-medium text-neutral-800">Left:</span>{' '}
                  <span className="break-words" title={left.text}>
                    {left.text}
                  </span>
                  <span className="mx-1 text-neutral-400" aria-hidden>
                    ·
                  </span>
                  <span className="font-medium text-neutral-800">Right:</span>{' '}
                  <span className="break-words" title={right.text}>
                    {right.text}
                  </span>
                </span>
              </p>

              <div className="mx-auto hidden w-full max-w-6xl flex-row items-center justify-center gap-3 lg:flex 2xl:max-w-[min(96rem,calc(100vw-4rem))] 2xl:gap-4">
                <div className="flex shrink-0 flex-col items-center justify-center self-center">
                  {verdictBinaryButton(left, 'left', false)}
                </div>
                <div className="min-h-0 min-w-0 flex-1 basis-0">{verdictCard}</div>
                <div className="flex shrink-0 flex-col items-center justify-center self-center">
                  {verdictBinaryButton(right, 'right', false)}
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-full flex-col items-center space-y-3 sm:max-w-3xl md:max-w-5xl lg:hidden">
                {verdictCard}
                <div className="flex w-full flex-row items-center justify-center gap-3 px-2 sm:gap-4">
                  {verdictBinaryButton(left, 'left', true)}
                  {verdictBinaryButton(right, 'right', true)}
                </div>
              </div>
            </div>
          );
        }

        if (qKind === 'true_false' && content.options.length === 2) {
          return (
            <div
              className={
                surface === 'challengeMint'
                  ? 'mx-auto max-w-3xl space-y-8'
                  : 'mx-auto max-w-2xl space-y-6'
              }
            >
              <h3
                className={
                  surface === 'challengeMint'
                    ? 'text-balance text-center font-serif text-2xl font-semibold leading-snug tracking-tight text-emerald-950 sm:text-3xl'
                    : 'text-center text-xl font-semibold text-neutral-900'
                }
              >
                {content.question}
              </h3>
              <div
                className={
                  surface === 'challengeMint'
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'
                    : 'grid grid-cols-1 gap-4 sm:grid-cols-2'
                }
              >
                {surface === 'challengeMint'
                  ? content.options.map((option) => mintChoiceButton(option, false))
                  : content.options.map((option) => optionTile(option, false))}
              </div>
            </div>
          );
        }

        if (surface === 'challengeMint') {
          const multi = !!content.multipleAnswers;
          const isMcq = qKind === 'multiple_choice' || qKind == null;
          if (isMcq) {
            return (
              <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 px-5 py-5 shadow-sm sm:px-6 sm:py-6">
                  <p className="border-l-[5px] border-indigo-600 pl-4 text-left font-serif text-xl font-medium leading-relaxed text-slate-900 sm:pl-5 sm:text-2xl sm:leading-relaxed md:text-[1.75rem] md:leading-snug lg:text-[1.875rem]">
                    {content.question}
                  </p>
                </div>
                {multi && (
                  <p className="text-left text-sm font-medium text-emerald-900/80">Select all that apply</p>
                )}
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {content.options.map((option, idx) => mintMcqListOption(option, idx, multi))}
                </div>
              </div>
            );
          }
          return (
            <div className="mx-auto max-w-3xl space-y-8">
              <h2 className="text-balance text-center font-serif text-2xl font-semibold leading-snug tracking-tight text-emerald-950 sm:text-3xl md:text-[2rem]">
                {content.question}
              </h2>
              {multi && (
                <p className="text-center text-sm font-medium text-emerald-900/75">Select all that apply</p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {content.options.map((option) => mintChoiceButton(option, multi))}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.question}</h3>
            {content.multipleAnswers && (
              <p className="text-sm text-neutral-500">Select all that apply</p>
            )}
            <div className="space-y-3">
              {content.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer tap-highlight
                    ${
                      selectedOptions.includes(option.id)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.text}</span>
                    {isAnswered &&
                      (option.isCorrect ? (
                        <CheckCircle2 className="text-emerald-500" size={20} />
                      ) : (
                        selectedOptions.includes(option.id) && (
                          <XCircle className="text-red-500" size={20} />
                        )
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'video-check': {
        const content = step.content as VideoCheckContent;
        const embed = videoEmbedUrl(content.videoUrl);
        const isYoutube = embed.includes('youtube-nocookie.com') || embed.includes('youtube.com/embed');
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">{content.title}</h3>
              <div className="aspect-video w-full max-w-3xl rounded-lg overflow-hidden bg-black">
                {isYoutube ? (
                  <iframe
                    title={content.title}
                    src={embed}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video key={content.videoUrl} className="w-full h-full" controls src={content.videoUrl}>
                    <track kind="captions" />
                  </video>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">{content.question}</h4>
              {content.multipleAnswers && (
                <p className="text-sm text-neutral-500">Select all that apply</p>
              )}
              <div className="space-y-3">
                {content.options.map(option => (
                  <div
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer tap-highlight
                      ${selectedOptions.includes(option.id)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                      } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.text}</span>
                      {isAnswered && (
                        option.isCorrect ? (
                          <CheckCircle2 className="text-emerald-500" size={20} />
                        ) : (
                          selectedOptions.includes(option.id) && (
                            <XCircle className="text-red-500" size={20} />
                          )
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'policy-attestation': {
        const content = step.content as PolicyAttestationContent;
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-900">
              <FileText className="text-emerald-600" size={24} />
              <h3 className="text-xl font-semibold">{content.documentTitle}</h3>
            </div>
            <p className="text-sm text-neutral-600">
              Scroll through the entire document, then confirm below.
            </p>
            <div
              ref={policyScrollRef}
              onScroll={() => {
                const el = policyScrollRef.current;
                if (!el || isAnswered) return;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) {
                  setPolicyReadComplete(true);
                }
              }}
              className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-neutral-50 text-sm text-neutral-800 whitespace-pre-wrap"
            >
              {content.documentBody}
            </div>
            {!policyReadComplete && !isAnswered && (
              <p className="text-xs text-amber-700">Scroll to the bottom to enable the attestation.</p>
            )}
            {policyReadComplete && !isAnswered && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyAttestChecked}
                  onChange={(e) => setPolicyAttestChecked(e.target.checked)}
                  className="mt-1 rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-800">
                  I have read this document and attest that I understand my responsibilities as described.
                </span>
              </label>
            )}
          </div>
        );
      }

      case 'password-create': {
        const content = step.content as PasswordRequirements;
        return (
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => !isAnswered && setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg pr-10"
                placeholder="Enter your password"
                disabled={isAnswered}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-500"
                type="button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className={password.length >= content.minLength ? 'text-emerald-600' : 'text-neutral-500'}>
                ✓ At least {content.minLength} characters
              </p>
              {content.requireCapital && (
                <p className={/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-neutral-500'}>
                  ✓ At least one capital letter
                </p>
              )}
              {content.requireNumber && (
                <p className={/[0-9]/.test(password) ? 'text-emerald-600' : 'text-neutral-500'}>
                  ✓ At least one number
                </p>
              )}
              {content.requireSpecial && (
                <p className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-600' : 'text-neutral-500'}>
                  ✓ At least one special character
                </p>
              )}
            </div>
          </div>
        );
      }

      case 'scenario': {
        const content = step.content as ScenarioContent;
        return (
          <div className="space-y-4">
            <p className="text-lg">{content.situation}</p>
            <div className="space-y-3">
              {content.options.map(option => (
                <div
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer tap-highlight
                    ${selectedOptions.includes(option.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                    } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.text}</span>
                    {isAnswered && (
                      option.isCorrect ? (
                        <CheckCircle2 className="text-emerald-500" size={20} />
                      ) : (
                        selectedOptions.includes(option.id) && (
                          <XCircle className="text-red-500" size={20} />
                        )
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'sequential': {
        const content = step.content as SequentialContent;
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.question}</h3>
            <p className="text-sm text-neutral-500">Arrange the steps in the correct order</p>
            <div className="space-y-2 border rounded-lg bg-neutral-50 p-2">
              {sequentialOrder.map((step, index) => (
                <div 
                  key={step.id}
                  className="bg-white p-3 rounded border flex items-center justify-between"
                >
                  <span className="flex-1">{step.text}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => moveStep(step.id, 'up')}
                      disabled={index === 0 || isAnswered}
                      aria-label="Move step up"
                      className={`p-1 rounded ${index === 0 || isAnswered ? 'text-neutral-300' : 'text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      <MoveUp size={18} />
                    </button>
                    <button
                      onClick={() => moveStep(step.id, 'down')}
                      disabled={index === sequentialOrder.length - 1 || isAnswered}
                      aria-label="Move step down"
                      className={`p-1 rounded ${index === sequentialOrder.length - 1 || isAnswered ? 'text-neutral-300' : 'text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      <MoveDown size={18} />
                    </button>
                  </div>
                  {isAnswered && (
                    <div className="ml-2">
                      {step.correctPosition === index + 1 ? (
                        <CheckCircle2 className="text-emerald-500" size={20} />
                      ) : (
                        <XCircle className="text-red-500" size={20} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'image-verification': {
        const content = step.content as ImageVerificationContent;
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.question}</h3>
            {content.multipleAnswers && (
              <p className="text-sm text-neutral-500">Select all legitimate items</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.images.map(image => (
                <div
                  key={image.id}
                  onClick={() => handleOptionSelect(image.id)}
                  className={`border rounded-lg overflow-hidden transition-colors cursor-pointer tap-highlight
                    ${selectedOptions.includes(image.id)
                      ? 'border-emerald-500 ring-2 ring-emerald-500'
                      : 'border-neutral-200 hover:border-neutral-300'
                    } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <img 
                    src={image.imageUrl} 
                    alt={image.caption || "Verification image"}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3 flex items-center justify-between">
                    <span>{image.caption || ""}</span>
                    {isAnswered && (
                      image.isReal ? (
                        <CheckCircle2 className="text-emerald-500" size={20} />
                      ) : (
                        selectedOptions.includes(image.id) && (
                          <XCircle className="text-red-500" size={20} />
                        )
                      )
                    )}
                  </div>
                  {isAnswered && image.explanation && (
                    <div className={`p-2 text-sm ${image.isReal ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {image.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'simulation': {
        const content = step.content as SimulationContent;
        const SimIcon = content.simulationType === 'email' ? Mail : content.simulationType === 'terminal' ? Terminal : Shield;
        
        return (
          <div className="space-y-6">
            <div className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
              <div className="mb-2 flex items-center gap-3">
                <SimIcon size={28} />
                <h3 className="text-2xl font-bold">{content.title}</h3>
              </div>
              <p className="text-emerald-100">
                {content.simulationType.charAt(0).toUpperCase() + content.simulationType.slice(1)} Simulation
              </p>
            </div>

            <div className="rounded border-l-4 border-emerald-600 bg-emerald-50 p-4">
              <p className="font-medium text-neutral-700">{content.instructions}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-800">Tasks:</h4>
              {content.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border-2 border-neutral-200 bg-white p-4"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-800">{task.description}</p>
                    <p className="mt-1 text-xs text-neutral-500">Expected: {task.correctAction}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {task.points} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-100 p-4">
              <p className="text-sm text-neutral-700">
                💡 <strong>Note:</strong> This is a simulation preview. In a full implementation, users would interact
                with a live simulated environment.
              </p>
            </div>
          </div>
        );
      }

      case 'phishing-inbox': {
        const content = step.content as PhishingInboxContent;
        const selected = content.emails.find(e => e.id === inboxSelectedId) ?? content.emails[0];
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-2">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-amber-900">{content.instructions}</p>
            </div>
            <div className="flex border rounded-lg overflow-hidden bg-white min-h-[320px]">
              <div className="w-1/3 border-r border-neutral-200 overflow-y-auto max-h-[400px]">
                {content.emails.map(em => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => !isAnswered && setInboxSelectedId(em.id)}
                    className={`w-full text-left px-3 py-2 border-b border-neutral-100 block hover:bg-neutral-50 ${
                      (inboxSelectedId ?? content.emails[0]?.id) === em.id ? 'bg-emerald-50' : ''
                    } ${isAnswered ? 'cursor-default' : ''}`}
                  >
                    <div className="text-xs text-neutral-500 truncate">{em.from}</div>
                    <div className="font-medium text-sm text-neutral-900 truncate">{em.subject}</div>
                    <div className="text-xs text-neutral-500 truncate">{em.preview}</div>
                  </button>
                ))}
              </div>
              <div className="flex-1 p-4 flex flex-col">
                {selected && (
                  <>
                    <div className="mb-2">
                      <div className="text-sm text-neutral-600">From: {selected.from}</div>
                      <h3 className="text-lg font-semibold">{selected.subject}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto text-neutral-700 text-sm whitespace-pre-wrap border rounded p-3 bg-neutral-50 mb-4">
                      {selected.body}
                    </div>
                    {!isAnswered && (
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setPhishingClassifications(prev => ({ ...prev, [selected.id]: 'phish' }))
                          }
                          className={`flex min-h-[3.25rem] w-full items-center justify-center rounded-lg px-2 py-3 text-center text-sm font-semibold leading-snug transition-colors sm:min-h-[3.5rem] sm:px-3 ${
                            phishingClassifications[selected.id] === 'phish'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          Report phishing
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPhishingClassifications(prev => ({ ...prev, [selected.id]: 'safe' }))
                          }
                          className={`flex min-h-[3.25rem] w-full items-center justify-center rounded-lg px-2 py-3 text-center text-sm font-semibold leading-snug transition-colors sm:min-h-[3.5rem] sm:px-3 ${
                            phishingClassifications[selected.id] === 'safe'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          Legitimate
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
    }
  };

  const canSubmit = () => {
    if (isAnswered) return true;
    
    switch (step.type) {
      case 'question':
      case 'scenario':
      case 'image-verification':
      case 'video-check':
        return selectedOptions.length > 0;
      case 'sequential':
        return sequentialOrder.length > 0;
      case 'password-create':
        return password.length > 0;
      case 'information':
      case 'simulation':
        return true;
      case 'phishing-inbox': {
        const content = step.content as PhishingInboxContent;
        return (
          content.emails.length > 0 &&
          content.emails.every(
            e => phishingClassifications[e.id] === 'phish' || phishingClassifications[e.id] === 'safe',
          )
        );
      }
      case 'policy-attestation':
        return policyReadComplete && policyAttestChecked;
      default:
        return false;
    }
  };

  return (
    <div
      className={`motion-safe:animate-content-shift ${
        surface === 'challengeMint' ? 'space-y-8' : 'space-y-6'
      }`}
    >
      {renderContent()}
      
      {showExplanation && step.explanation && (
        <div
          className={`p-4 rounded-lg ${
            canContinue
              ? 'bg-emerald-50 motion-safe:animate-feedback-ok'
              : 'bg-red-50 motion-safe:animate-feedback-wrong'
          }`}
        >
          <div className="flex items-start gap-3">
            {canContinue ? (
              <CheckCircle2 className="text-emerald-500 mt-1" size={20} />
            ) : (
              <XCircle className="text-red-500 mt-1" size={20} />
            )}
            <p className="text-neutral-700">{step.explanation}</p>
          </div>
        </div>
      )}

      <div
        className={
          surface === 'challengeMint'
            ? 'flex justify-center px-1 pt-2 sm:pt-4'
            : 'flex items-center justify-between'
        }
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className={
            surface === 'challengeMint'
              ? `min-w-[min(100%,18rem)] rounded-full px-10 py-3.5 text-base font-semibold shadow-md transition-all tap-highlight sm:min-w-[20rem] sm:px-12 sm:py-4 sm:text-lg ${
                  !canSubmit()
                    ? 'cursor-not-allowed bg-emerald-200/45 text-emerald-800/50 shadow-none'
                    : isAnswered
                      ? canContinue
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
                        : 'cursor-not-allowed bg-emerald-200/45 text-emerald-800/50 shadow-none'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
                }`
              : `rounded-lg px-6 py-2 font-medium transition-colors tap-highlight ${
                  !canSubmit()
                    ? 'cursor-not-allowed bg-neutral-100 text-neutral-500 motion-safe:hover:translate-y-0 motion-safe:active:scale-100'
                    : isAnswered
                      ? canContinue
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'cursor-not-allowed bg-neutral-100 text-neutral-500 motion-safe:hover:translate-y-0 motion-safe:active:scale-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`
          }
        >
          {!isAnswered ? 'Submit Answer' : isLast ? 'Complete Challenge' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
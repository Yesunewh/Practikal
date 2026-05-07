import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import type {
  QuestionContent,
  QuestionKind,
  QuestionVerdictContext,
  VerdictMessageChannel,
} from '../../../types';
import { QUESTION_KIND_OPTIONS } from '../../../constants/questionKinds';
import { validateQuestionContent } from '../../../utils/validateQuestionStepContent';
import toast from 'react-hot-toast';
import GmailMockMessage from '../../GmailMockMessage';
import WhatsAppMockMessage from '../../WhatsAppMockMessage';
import TelegramMockMessage from '../../TelegramMockMessage';

interface QuizBuilderProps {
  onSave: (stepData: {
    type: 'question';
    content: {
      question: string;
      options: { id: string; text: string; isCorrect: boolean }[];
      multipleAnswers: boolean;
      questionKind?: QuestionKind;
      scenarioBody?: string;
      verdictContext?: QuestionVerdictContext;
    };
    explanation: string;
  }) => void;
  onCancel: () => void;
}

const TF_OPTIONS = () => [
  { id: 'tf-1', text: 'True', isCorrect: true },
  { id: 'tf-2', text: 'False', isCorrect: false },
];

const VERDICT_OPTIONS = () => [
  { id: 'bv-1', text: 'Looks like phishing', isCorrect: true },
  { id: 'bv-2', text: 'Looks real', isCorrect: false },
];

const VERDICT_BODY_DEFAULTS: Record<VerdictMessageChannel, string> = {
  gmail: `Dear network user,

This email is meant to inform you that your MyUniversity network password will expire in 24 hours.
Please follow the link below to update your password
myuniversity.edu/renewal

Thank you
MyUniversity Network Security Staff`,
  whatsapp: 'Hello, this is payroll support. Please verify your account details now.',
  telegram: `It's a good start, but I think you can improve it more and do even better.`,
};

const VERDICT_CONTEXT_DEFAULTS: Record<VerdictMessageChannel, QuestionVerdictContext> = {
  gmail: {
    channel: 'gmail',
    clientBrand: 'Gmail',
    fromLine: 'info@insa.com.et',
    subjectLine: 'your new acount',
  },
  whatsapp: {
    channel: 'whatsapp',
    fromLine: 'IT Security Team',
    subjectLine: '+251 91 000 0000',
  },
  telegram: {
    channel: 'telegram',
    fromLine: 'Edemy',
    subjectLine: 'Waiting for network...',
    telegramShowOwnerBadge: true,
    telegramQuoteAuthor: 'Friend',
    telegramQuotePreview: 'Please tell me',
  },
};

const VERDICT_CHANNEL_OPTIONS: { value: VerdictMessageChannel; label: string }[] = [
  { value: 'gmail', label: 'Gmail-style email' },
  { value: 'whatsapp', label: 'WhatsApp-style chat' },
  { value: 'telegram', label: 'Telegram-style chat' },
];

export default function QuizBuilder({ onSave, onCancel }: QuizBuilderProps) {
  const [questionKind, setQuestionKind] = useState<QuestionKind>('multiple_choice');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false },
  ]);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [scenarioBody, setScenarioBody] = useState('');
  const [verdictContext, setVerdictContext] = useState<QuestionVerdictContext>({
    channel: 'gmail',
    clientBrand: 'Gmail',
    fromLine: '',
    subjectLine: '',
  });

  const setKind = (kind: QuestionKind) => {
    setQuestionKind(kind);
    if (kind === 'true_false') {
      setOptions(TF_OPTIONS());
      setMultipleAnswers(false);
    } else if (kind === 'binary_verdict') {
      setOptions(VERDICT_OPTIONS());
      setMultipleAnswers(false);
      setVerdictContext({ ...VERDICT_CONTEXT_DEFAULTS.gmail });
      setScenarioBody(VERDICT_BODY_DEFAULTS.gmail);
    }
  };

  const setVerdictChannel = (channel: VerdictMessageChannel) => {
    setVerdictContext((prev) => {
      const base = { ...(VERDICT_CONTEXT_DEFAULTS[channel] as QuestionVerdictContext) };
      return {
        ...base,
        ...prev,
        channel,
        clientBrand: channel === 'gmail' ? prev.clientBrand?.trim() || 'Gmail' : undefined,
        fromLine: prev.fromLine?.trim() ? prev.fromLine : base.fromLine,
        subjectLine: prev.subjectLine?.trim() ? prev.subjectLine : base.subjectLine,
        institutionFooter: channel === 'gmail' ? prev.institutionFooter ?? base.institutionFooter : undefined,
        telegramShowOwnerBadge:
          channel === 'telegram' ? prev.telegramShowOwnerBadge ?? base.telegramShowOwnerBadge : undefined,
        telegramQuoteAuthor:
          channel === 'telegram'
            ? prev.telegramQuoteAuthor?.trim()
              ? prev.telegramQuoteAuthor
              : base.telegramQuoteAuthor
            : undefined,
        telegramQuotePreview:
          channel === 'telegram'
            ? prev.telegramQuotePreview?.trim()
              ? prev.telegramQuotePreview
              : base.telegramQuotePreview
            : undefined,
      };
    });
    setScenarioBody((prev) => (prev.trim() ? prev : VERDICT_BODY_DEFAULTS[channel]));
  };

  const addOption = () => {
    if (questionKind !== 'multiple_choice') return;
    setOptions([...options, { id: Date.now().toString(), text: '', isCorrect: false }]);
  };

  const removeOption = (id: string) => {
    if (questionKind !== 'multiple_choice' || options.length <= 2) return;
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const updateOptionText = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  /** Single-correct modes: only one option may be correct. */
  const setExclusiveCorrect = (id: string) => {
    setOptions(options.map((opt) => ({ ...opt, isCorrect: opt.id === id })));
  };

  const toggleCorrectMulti = (id: string, checked: boolean) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, isCorrect: checked } : opt)),
    );
  };

  const handleCorrectControl = (id: string, checked: boolean) => {
    if (questionKind === 'true_false' || questionKind === 'binary_verdict') {
      if (checked) setExclusiveCorrect(id);
      return;
    }
    if (questionKind === 'multiple_choice' && !multipleAnswers) {
      if (checked) setExclusiveCorrect(id);
      else toggleCorrectMulti(id, false);
      return;
    }
    toggleCorrectMulti(id, checked);
  };

  const handleSave = () => {
    const content: QuestionContent = {
      question: question.trim(),
      options,
      multipleAnswers: questionKind === 'multiple_choice' ? multipleAnswers : false,
      questionKind,
      ...(questionKind === 'binary_verdict'
        ? {
            // Persist selected channel and normalize optional chrome fields.
            // Existing records without channel still render as Gmail by default.
            scenarioBody: scenarioBody.trim(),
            verdictContext: {
              channel: verdictContext.channel ?? 'gmail',
              clientBrand:
                (verdictContext.channel ?? 'gmail') === 'gmail'
                  ? verdictContext.clientBrand?.trim() || 'Gmail'
                  : undefined,
              fromLine: verdictContext.fromLine?.trim(),
              subjectLine: verdictContext.subjectLine?.trim(),
              ...((verdictContext.channel ?? 'gmail') === 'gmail' && verdictContext.institutionFooter === true
                ? { institutionFooter: true as const }
                : {}),
              ...((verdictContext.channel ?? 'gmail') === 'telegram' &&
              verdictContext.telegramShowOwnerBadge === true
                ? { telegramShowOwnerBadge: true as const }
                : {}),
              ...((verdictContext.channel ?? 'gmail') === 'telegram' &&
              verdictContext.telegramQuoteAuthor?.trim() &&
              verdictContext.telegramQuotePreview?.trim()
                ? {
                    telegramQuoteAuthor: verdictContext.telegramQuoteAuthor.trim(),
                    telegramQuotePreview: verdictContext.telegramQuotePreview.trim(),
                  }
                : {}),
            },
          }
        : {}),
    };

    const err = validateQuestionContent(content);
    if (err) {
      toast.error(err);
      return;
    }

    onSave({ type: 'question', content, explanation });
  };

  const verdictMeta = QUESTION_KIND_OPTIONS.find((o) => o.value === questionKind);
  const verdictChannel = verdictContext.channel ?? 'gmail';
  const isGmailChannel = verdictChannel === 'gmail';
  const isTelegramChannel = verdictChannel === 'telegram';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Quiz question builder</h3>
        <p className="text-sm text-gray-500">
          Pick a question type, then fill in fields. Learners see the layout that matches the type.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Question type *</label>
        <select
          aria-label="Question type"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          value={questionKind}
          onChange={(e) => setKind(e.target.value as QuestionKind)}
        >
          {QUESTION_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {verdictMeta && (
          <p className="text-xs text-gray-500 mt-2">{verdictMeta.description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {questionKind === 'binary_verdict' ? 'Headline (e.g. Real or phishing?) *' : 'Question / statement *'}
        </label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={questionKind === 'true_false' ? 2 : 3}
          placeholder={
            questionKind === 'binary_verdict'
              ? 'e.g. Real or phishing?'
              : 'Enter your question or statement…'
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      {questionKind === 'binary_verdict' && (
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800">Mock message channel and content</h4>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Message channel</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {VERDICT_CHANNEL_OPTIONS.map(({ value: channel, label }) => {
                const selected = verdictChannel === channel;
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setVerdictChannel(channel)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                    aria-pressed={selected}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {isGmailChannel && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mail client label</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Gmail"
                  value={verdictContext.clientBrand ?? ''}
                  onChange={(e) =>
                    setVerdictContext({ ...verdictContext, clientBrand: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                <input
                  type="checkbox"
                  id="gmailInstitutionFooter"
                  checked={verdictContext.institutionFooter === true}
                  onChange={(e) =>
                    setVerdictContext({
                      ...verdictContext,
                      institutionFooter: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                />
                <label htmlFor="gmailInstitutionFooter" className="text-sm text-gray-700">
                  Show university logo footer (MY UNIVERSITY block under the message)
                </label>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isGmailChannel ? 'From line' : 'Contact name *'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder={
                isGmailChannel
                  ? 'e.g. info@insa.com.et or Name <email@domain.com>'
                  : verdictChannel === 'telegram'
                    ? 'e.g. Edemy'
                    : 'e.g. HR Team'
              }
              value={verdictContext.fromLine ?? ''}
              onChange={(e) =>
                setVerdictContext({ ...verdictContext, fromLine: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isGmailChannel ? 'Subject line' : 'Subtitle (optional)'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder={
                isGmailChannel
                  ? 'e.g. DocuSign: Please review this document'
                  : verdictChannel === 'telegram'
                    ? 'e.g. Waiting for network...'
                    : 'e.g. +251 91 000 0000'
              }
              value={verdictContext.subjectLine ?? ''}
              onChange={(e) =>
                setVerdictContext({ ...verdictContext, subjectLine: e.target.value })
              }
            />
          </div>
          {isTelegramChannel && (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="telegramOwnerBadge"
                  checked={verdictContext.telegramShowOwnerBadge === true}
                  onChange={(e) =>
                    setVerdictContext({
                      ...verdictContext,
                      telegramShowOwnerBadge: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                />
                <label htmlFor="telegramOwnerBadge" className="text-sm text-gray-700">
                  Show “Owner” badge (purple tag)
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reply quote author (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g. Friend"
                  value={verdictContext.telegramQuoteAuthor ?? ''}
                  onChange={(e) =>
                    setVerdictContext({ ...verdictContext, telegramQuoteAuthor: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reply quote preview (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g. Please tell me"
                  value={verdictContext.telegramQuotePreview ?? ''}
                  onChange={(e) =>
                    setVerdictContext({ ...verdictContext, telegramQuotePreview: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message body *</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              rows={8}
              placeholder={
                isGmailChannel
                  ? 'Paste or write the email body learners will evaluate...'
                  : verdictChannel === 'telegram'
                    ? 'Use **bold**, https:// links, and #hashtags in plain text...'
                    : 'Paste or write the chat message learners will evaluate...'
              }
              value={scenarioBody}
              onChange={(e) => setScenarioBody(e.target.value)}
            />
          </div>
        </div>
      )}

      {questionKind === 'multiple_choice' && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="multipleAnswers"
            checked={multipleAnswers}
            onChange={(e) => {
              const on = e.target.checked;
              setMultipleAnswers(on);
              if (!on) {
                const firstCorrect = options.find((o) => o.isCorrect);
                const keepId = firstCorrect?.id ?? options[0]?.id;
                if (keepId) {
                  setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === keepId })));
                }
              }
            }}
            className="h-5 w-5 text-emerald-600"
          />
          <label htmlFor="multipleAnswers" className="text-sm font-medium text-gray-700">
            Allow multiple correct answers
          </label>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">Answer choices *</label>
          {questionKind === 'multiple_choice' && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center font-medium"
            >
              <Plus size={16} className="mr-1" />
              Add option
            </button>
          )}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mb-4">
          <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl mx-auto text-sm text-gray-500">
            {questionKind === 'binary_verdict' ? (
              <div className="space-y-3">
                <p>
                  Preview: learners see your headline, the mock message in the center, and two side actions.
                </p>
                <div className="h-[280px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  {verdictChannel === 'whatsapp' ? (
                    <WhatsAppMockMessage
                      fromLine={verdictContext.fromLine}
                      subjectLine={verdictContext.subjectLine}
                      body={scenarioBody}
                    />
                  ) : verdictChannel === 'telegram' ? (
                    <TelegramMockMessage
                      fromLine={verdictContext.fromLine}
                      subjectLine={verdictContext.subjectLine}
                      body={scenarioBody}
                      showOwnerBadge={verdictContext.telegramShowOwnerBadge === true}
                      replyQuote={
                        verdictContext.telegramQuoteAuthor?.trim() &&
                        verdictContext.telegramQuotePreview?.trim()
                          ? {
                              author: verdictContext.telegramQuoteAuthor.trim(),
                              preview: verdictContext.telegramQuotePreview.trim(),
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <GmailMockMessage
                      clientBrand={verdictContext.clientBrand}
                      fromLine={verdictContext.fromLine}
                      subjectLine={verdictContext.subjectLine}
                      body={scenarioBody}
                      institutionFooter={verdictContext.institutionFooter === true}
                    />
                  )}
                </div>
              </div>
            ) : (
              <p>Learners tap one row below the prompt (or several if multi-select is on).</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-start gap-3 p-4 border rounded-lg bg-white">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                  {questionKind === 'multiple_choice' && multipleAnswers ? (
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => handleCorrectControl(option.id, e.target.checked)}
                      className="h-5 w-5 text-emerald-600"
                      title="Correct answer"
                      aria-label={`Mark option ${index + 1} as correct`}
                    />
                  ) : (
                    <input
                      type="radio"
                      name="quiz-builder-correct"
                      checked={option.isCorrect}
                      onChange={() => handleCorrectControl(option.id, true)}
                      className="h-4 w-4 text-emerald-600"
                      title="Correct answer"
                      aria-label={`Correct answer: option ${index + 1}`}
                    />
                  )}
                  <span className="text-xs text-gray-500">Correct</span>
                </div>
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={
                    questionKind === 'true_false'
                      ? index === 0
                        ? 'True'
                        : 'False'
                      : questionKind === 'binary_verdict'
                        ? index === 0
                          ? 'Looks like phishing'
                          : 'Looks real'
                        : `Option ${index + 1}`
                  }
                  value={option.text}
                  onChange={(e) => updateOptionText(option.id, e.target.value)}
                />
              </div>
              {questionKind === 'multiple_choice' && options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Remove option"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (optional)</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Shown after submit — why the correct answer is right."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium inline-flex items-center gap-2"
        >
          <Check size={18} />
          Add quiz step
        </button>
      </div>
    </div>
  );
}

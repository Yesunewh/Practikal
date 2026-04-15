import { useState, useEffect, useRef } from 'react';
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
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { CheckCircle2, XCircle, Eye, EyeOff, MoveUp, MoveDown, Terminal, Mail, Shield, AlertTriangle, FileText } from 'lucide-react';

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
}

export default function ChallengeStep({ step, onComplete, isLast }: ChallengeStepProps) {
  const { user } = useAuth();
  const { logActivity } = useProgress();
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

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    
    if (step.type === 'question' || step.type === 'scenario' || step.type === 'video-check') {
      const content = step.content as QuestionContent | ScenarioContent | VideoCheckContent;
      if ('multipleAnswers' in content && content.multipleAnswers) {
        setSelectedOptions(prev => 
          prev.includes(optionId) 
            ? prev.filter(id => id !== optionId)
            : [...prev, optionId]
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
      logActivity({
        userId: user.id,
        type: 'policy_attested',
        details: { policyId: c.policyId, policyTitle: c.documentTitle },
      });
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
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            <p className="text-gray-600">{content.description}</p>
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
                : 'border-gray-200 hover:border-gray-300'
            } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex flex-col items-center justify-center gap-2 min-h-[3rem]">
              <span className="text-gray-900">{option.text}</span>
              {isAnswered &&
                (option.isCorrect ? (
                  <CheckCircle2 className="text-emerald-500" size={22} />
                ) : (
                  selectedOptions.includes(option.id) && <XCircle className="text-red-500" size={22} />
                ))}
            </div>
          </div>
        );

        const verdictCard = (
          <div className="flex-1 min-w-0 rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden flex flex-col max-h-[480px]">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-medium text-gray-600">
              {ctx.clientBrand || 'YourMail'}
            </div>
            <div className="p-4 flex-1 overflow-y-auto text-left space-y-3">
              {ctx.fromLine && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">From:</span> {ctx.fromLine}
                </p>
              )}
              {ctx.subjectLine && (
                <p className="text-base font-semibold text-gray-900">{ctx.subjectLine}</p>
              )}
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-3">
                {content.scenarioBody || '—'}
              </div>
            </div>
          </div>
        );

        if (qKind === 'binary_verdict' && content.options.length >= 2) {
          const [left, right] = content.options;
          return (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl sm:text-3xl text-center text-emerald-900 font-semibold tracking-tight">
                {content.question}
              </h2>

              <div className="hidden lg:flex flex-row gap-4 items-stretch max-w-5xl mx-auto w-full">
                {optionTile(left, false)}
                {verdictCard}
                {optionTile(right, false)}
              </div>

              <div className="lg:hidden space-y-4 max-w-lg mx-auto w-full">
                {verdictCard}
                <div className="grid grid-cols-2 gap-3">{optionTile(left, true)}{optionTile(right, true)}</div>
              </div>
            </div>
          );
        }

        if (qKind === 'true_false' && content.options.length === 2) {
          return (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-center text-gray-900">{content.question}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.options.map((option) => optionTile(option, false))}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.question}</h3>
            {content.multipleAnswers && (
              <p className="text-sm text-gray-500">Select all that apply</p>
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
                        : 'border-gray-200 hover:border-gray-300'
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h3>
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
                <p className="text-sm text-gray-500">Select all that apply</p>
              )}
              <div className="space-y-3">
                {content.options.map(option => (
                  <div
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer tap-highlight
                      ${selectedOptions.includes(option.id)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
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
            <div className="flex items-center gap-2 text-gray-900">
              <FileText className="text-emerald-600" size={24} />
              <h3 className="text-xl font-semibold">{content.documentTitle}</h3>
            </div>
            <p className="text-sm text-gray-600">
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
              className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap"
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
                  className="mt-1 rounded border-gray-300"
                />
                <span className="text-sm text-gray-800">
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
                className="absolute right-3 top-3 text-gray-500"
                type="button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className={password.length >= content.minLength ? 'text-emerald-600' : 'text-gray-500'}>
                ✓ At least {content.minLength} characters
              </p>
              {content.requireCapital && (
                <p className={/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-gray-500'}>
                  ✓ At least one capital letter
                </p>
              )}
              {content.requireNumber && (
                <p className={/[0-9]/.test(password) ? 'text-emerald-600' : 'text-gray-500'}>
                  ✓ At least one number
                </p>
              )}
              {content.requireSpecial && (
                <p className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-600' : 'text-gray-500'}>
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
                      : 'border-gray-200 hover:border-gray-300'
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
            <p className="text-sm text-gray-500">Arrange the steps in the correct order</p>
            <div className="space-y-2 border rounded-lg bg-gray-50 p-2">
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
                      className={`p-1 rounded ${index === 0 || isAnswered ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <MoveUp size={18} />
                    </button>
                    <button
                      onClick={() => moveStep(step.id, 'down')}
                      disabled={index === sequentialOrder.length - 1 || isAnswered}
                      aria-label="Move step down"
                      className={`p-1 rounded ${index === sequentialOrder.length - 1 || isAnswered ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
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
              <p className="text-sm text-gray-500">Select all legitimate items</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.images.map(image => (
                <div
                  key={image.id}
                  onClick={() => handleOptionSelect(image.id)}
                  className={`border rounded-lg overflow-hidden transition-colors cursor-pointer tap-highlight
                    ${selectedOptions.includes(image.id)
                      ? 'border-emerald-500 ring-2 ring-emerald-500'
                      : 'border-gray-200 hover:border-gray-300'
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
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <SimIcon size={28} />
                <h3 className="text-2xl font-bold">{content.title}</h3>
              </div>
              <p className="text-purple-100">{content.simulationType.charAt(0).toUpperCase() + content.simulationType.slice(1)} Simulation</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-gray-700 font-medium">{content.instructions}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Tasks:</h4>
              {content.tasks.map((task, index) => (
                <div key={task.id} className="flex items-start gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Expected: {task.correctAction}</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
                    {task.points} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                💡 <strong>Note:</strong> This is a simulation preview. In a full implementation, users would interact with a live simulated environment.
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
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto max-h-[400px]">
                {content.emails.map(em => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => !isAnswered && setInboxSelectedId(em.id)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-100 block hover:bg-gray-50 ${
                      (inboxSelectedId ?? content.emails[0]?.id) === em.id ? 'bg-emerald-50' : ''
                    } ${isAnswered ? 'cursor-default' : ''}`}
                  >
                    <div className="text-xs text-gray-500 truncate">{em.from}</div>
                    <div className="font-medium text-sm text-gray-900 truncate">{em.subject}</div>
                    <div className="text-xs text-gray-500 truncate">{em.preview}</div>
                  </button>
                ))}
              </div>
              <div className="flex-1 p-4 flex flex-col">
                {selected && (
                  <>
                    <div className="mb-2">
                      <div className="text-sm text-gray-600">From: {selected.from}</div>
                      <h3 className="text-lg font-semibold">{selected.subject}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto text-gray-700 text-sm whitespace-pre-wrap border rounded p-3 bg-gray-50 mb-4">
                      {selected.body}
                    </div>
                    {!isAnswered && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            setPhishingClassifications(prev => ({ ...prev, [selected.id]: 'phish' }))
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            phishingClassifications[selected.id] === 'phish'
                              ? 'bg-red-600 text-white'
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
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            phishingClassifications[selected.id] === 'safe'
                              ? 'bg-emerald-600 text-white'
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
    <div className="space-y-6 motion-safe:animate-content-shift">
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
            <p className="text-gray-700">{step.explanation}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className={`px-6 py-2 rounded-lg font-medium transition-colors tap-highlight ${
            !canSubmit()
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed motion-safe:hover:translate-y-0 motion-safe:active:scale-100'
              : isAnswered
              ? canContinue
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed motion-safe:hover:translate-y-0 motion-safe:active:scale-100'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {!isAnswered ? 'Submit Answer' : isLast ? 'Complete Challenge' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
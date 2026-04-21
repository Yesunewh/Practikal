import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check, ClipboardList, FileText, ListOrdered, Loader2 } from 'lucide-react';
import {
  Challenge,
  ChallengeStep,
  ImageVerificationContent,
  InformationContent,
  QuestionContent,
  ScenarioContent,
  SequentialContent,
  SimulationContent,
} from '../../types';
import { validateQuestionContent, validateScenarioContent } from '../../utils/validateQuestionStepContent';
import toast from 'react-hot-toast';
import { questionKindLabel } from '../../constants/questionKinds';
import ChallengeTypeTemplates from './ChallengeTypeTemplates';
import QuizBuilder from './builders/QuizBuilder';
import ScenarioBuilder from './builders/ScenarioBuilder';
import SequentialBuilder from './builders/SequentialBuilder';
import ImageVerificationBuilder from './builders/ImageVerificationBuilder';
import PasswordBuilder from './builders/PasswordBuilder';
import SimulationBuilder from './builders/SimulationBuilder';

interface CreateChallengeProps {
  onSave: (challenge: Partial<Challenge>) => void | Promise<void>;
  onCancel: () => void;
  /** When set, form opens on Basic Info with this data and saves update the same challenge id. */
  initialChallenge?: Challenge | null;
}

function stepSummaryLine(step: ChallengeStep): string {
  if (step.type === 'question') {
    const c = step.content as QuestionContent;
    const kind = questionKindLabel(c.questionKind);
    const q = (c.question || '').trim() || 'Untitled';
    const short = q.length > 90 ? `${q.slice(0, 90)}…` : q;
    return `${kind}: ${short}`;
  }
  if (step.type === 'simulation') {
    const c = step.content as SimulationContent;
    const kind = formatDisplayLabel(c.simulationType);
    const t = (c.title || '').trim() || 'Untitled simulation';
    const short = t.length > 90 ? `${t.slice(0, 90)}…` : t;
    return `${kind} simulation · ${short}`;
  }
  if (step.type === 'scenario') {
    const c = step.content as ScenarioContent;
    const s = (c.situation || '').trim() || 'Untitled scenario';
    const short = s.length > 90 ? `${s.slice(0, 90)}…` : s;
    return `Scenario: ${short}`;
  }
  if (step.type === 'sequential') {
    const c = step.content as SequentialContent;
    const q = (c.question || '').trim() || 'Untitled';
    const short = q.length > 90 ? `${q.slice(0, 90)}…` : q;
    return `Sequential: ${short}`;
  }
  if (step.type === 'image-verification') {
    const c = step.content as ImageVerificationContent;
    const q = (c.question || '').trim() || 'Untitled';
    const short = q.length > 90 ? `${q.slice(0, 90)}…` : q;
    return `Image check: ${short}`;
  }
  if (step.type === 'information') {
    const c = step.content as InformationContent;
    const t = (c.title || '').trim() || 'Information step';
    const short = t.length > 90 ? `${t.slice(0, 90)}…` : t;
    return short;
  }
  const raw = (step.content as { question?: string }).question?.trim();
  return raw || 'Untitled step';
}

function formatDisplayLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function emptyChallengeData() {
  return {
    title: '',
    description: '',
    type: 'quiz' as Challenge['type'],
    xpReward: 100,
    reputationReward: 5,
    duration: 10,
    difficulty: 'beginner' as Challenge['difficulty'],
    category: 'general' as Challenge['category'],
    steps: [] as ChallengeStep[],
  };
}

function challengeToFormState(ch: Challenge): ReturnType<typeof emptyChallengeData> {
  return {
    title: ch.title ?? '',
    description: ch.description ?? '',
    type: (ch.type || 'quiz') as Challenge['type'],
    xpReward: ch.xpReward ?? 100,
    reputationReward: ch.reputationReward ?? 5,
    duration: ch.duration ?? 10,
    difficulty: (ch.difficulty || 'beginner') as Challenge['difficulty'],
    category: (ch.category || 'general') as Challenge['category'],
    steps: Array.isArray(ch.steps) ? (ch.steps.map((s) => ({ ...s })) as ChallengeStep[]) : [],
  };
}

function getStepsValidationError(steps: ChallengeStep[]): string | null {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.type === 'question') {
      const msg = validateQuestionContent(step.content as QuestionContent);
      if (msg) return `Step ${i + 1} (quiz): ${msg}`;
    }
    if (step.type === 'scenario') {
      const msg = validateScenarioContent(step.content as ScenarioContent);
      if (msg) return `Step ${i + 1} (scenario): ${msg}`;
    }
  }
  return null;
}

export default function CreateChallenge({ onSave, onCancel, initialChallenge = null }: CreateChallengeProps) {
  const isEditMode = Boolean(initialChallenge?.id);
  const minStep = isEditMode ? 1 : 0;

  const [currentStep, setCurrentStep] = useState(() => (isEditMode ? 1 : 0));
  const [showBuilder, setShowBuilder] = useState(false);
  const [challengeData, setChallengeData] = useState(() =>
    initialChallenge ? challengeToFormState(initialChallenge) : emptyChallengeData(),
  );
  const [isPublishing, setIsPublishing] = useState(false);

  const handleBasicInfoChange = (field: string, value: any) => {
    setChallengeData({ ...challengeData, [field]: value });
  };

  const removeStep = (index: number) => {
    setChallengeData({
      ...challengeData,
      steps: challengeData.steps.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (isPublishing) return;

    if (challengeData.steps.length === 0) {
      toast.error('Add at least one step before publishing.');
      return;
    }

    if (!challengeData.title?.trim() || !challengeData.description?.trim()) {
      toast.error('Title and description are required.');
      return;
    }

    const stepErr = getStepsValidationError(challengeData.steps);
    if (stepErr) {
      toast.error(stepErr);
      return;
    }

    setIsPublishing(true);
    try {
      await Promise.resolve(onSave(challengeData));
    } finally {
      setIsPublishing(false);
    }
  };

  const tryAdvanceStep = () => {
    if (currentStep === 1) {
      if (!challengeData.title?.trim() || !challengeData.description?.trim()) {
        toast.error('Title and description are required.');
        return;
      }
      const duration = Number(challengeData.duration);
      if (!Number.isFinite(duration) || duration < 1) {
        toast.error('Duration must be at least 1 minute.');
        return;
      }
      const xp = Number(challengeData.xpReward);
      const rep = Number(challengeData.reputationReward);
      if (!Number.isFinite(xp) || xp < 0) {
        toast.error('XP reward must be 0 or greater.');
        return;
      }
      if (!Number.isFinite(rep) || rep < 0) {
        toast.error('Reputation reward must be 0 or greater.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (showBuilder) {
        toast.error('Finish or cancel the step builder before continuing.');
        return;
      }
      if (challengeData.steps.length === 0) {
        toast.error('Add at least one step before continuing.');
        return;
      }
      const stepErr = getStepsValidationError(challengeData.steps);
      if (stepErr) {
        toast.error(stepErr);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleTypeSelect = (type: string) => {
    setChallengeData({
      ...challengeData,
      type: type as Challenge['type']
    });
    setCurrentStep(1); // Move to basic info step
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ChallengeTypeTemplates onSelectType={handleTypeSelect} onCancel={onCancel} />
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
              <p className="text-sm text-gray-500 mb-6">Set up the basic details for your challenge</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Challenge Title *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Password Security Basics"
                  value={challengeData.title}
                  onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={4}
                  placeholder="Describe what users will learn..."
                  value={challengeData.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Challenge type</label>
                <div
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 capitalize"
                  title="Set on the previous step"
                >
                  {challengeData.type}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {isEditMode
                    ? 'Type is fixed for this challenge.'
                    : 'Chosen on the type screen — use Previous to change it.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.difficulty}
                  onChange={(e) => handleBasicInfoChange('difficulty', e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.category}
                  onChange={(e) => handleBasicInfoChange('category', e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="phishing">Phishing</option>
                  <option value="malware">Malware</option>
                  <option value="password">Password</option>
                  <option value="social-engineering">Social Engineering</option>
                  <option value="incident-response">Incident Response</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.duration}
                  onChange={(e) => handleBasicInfoChange('duration', parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">XP Reward</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.xpReward}
                  onChange={(e) => handleBasicInfoChange('xpReward', parseInt(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reputation Reward</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.reputationReward}
                  onChange={(e) => handleBasicInfoChange('reputationReward', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        // Show specialized builder based on challenge type
        if (showBuilder) {
          const handleBuilderSave = (stepData: any) => {
            const newStep: ChallengeStep = {
              id: Date.now().toString(),
              type: stepData.type,
              content: stepData.content,
              explanation: stepData.explanation
            };
            
            setChallengeData({
              ...challengeData,
              steps: [...challengeData.steps, newStep]
            });
            setShowBuilder(false);
          };

          // Render appropriate builder based on challenge type
          switch (challengeData.type) {
            case 'quiz':
              return <QuizBuilder onSave={handleBuilderSave} onCancel={() => setShowBuilder(false)} />;
            case 'scenario':
              return <ScenarioBuilder onSave={handleBuilderSave} onCancel={() => setShowBuilder(false)} />;
            case 'sequential':
              return <SequentialBuilder onSave={handleBuilderSave} onCancel={() => setShowBuilder(false)} />;
            case 'verification':
              return <ImageVerificationBuilder onSave={handleBuilderSave} onCancel={() => setShowBuilder(false)} />;
            case 'password':
              return <PasswordBuilder onSave={handleBuilderSave} onCancel={() => setShowBuilder(false)} />;
            case 'simulation':
              return <SimulationBuilder onSave={handleBuilderSave} onCancel={() => setShowBuilder(false)} />;
            default:
              return <QuizBuilder onSave={handleBuilderSave} onCancel={() => setShowBuilder(false)} />;
          }
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Add Challenge Steps</h3>
                <p className="text-sm text-gray-500 mt-1">{challengeData.steps.length} step(s) added</p>
              </div>
            </div>

            {/* Add Step Button */}
            <div className="border-2 border-dashed rounded-lg p-8 bg-gray-50 text-center">
              <h4 className="font-medium text-gray-700 mb-2">Ready to add steps?</h4>
              <p className="text-sm text-gray-500 mb-4">
                Use the specialized {challengeData.type} builder to create interactive steps
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-medium inline-flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Open {challengeData.type.charAt(0).toUpperCase() + challengeData.type.slice(1)} Builder
              </button>
            </div>

            {/* List of Added Steps */}
            {challengeData.steps.length > 0 && (
              <div className="border rounded-lg p-6">
                <h4 className="font-medium text-gray-700 mb-4">Added Steps ({challengeData.steps.length})</h4>
                <div className="space-y-3">
                  {challengeData.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:border-emerald-300 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">Step {index + 1}</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                            {step.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{stepSummaryLine(step)}</p>
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-700 ml-4 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Review & publish</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                  Confirm basic info, read the description, and skim steps in order. Use <span className="font-medium text-gray-700">Previous</span> if anything needs a change.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {challengeData.steps.length} step{challengeData.steps.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <ClipboardList className="h-5 w-5" aria-hidden />
                  </div>
                  <h4 className="font-semibold text-gray-800">Challenge summary</h4>
                </div>
                <dl className="divide-y divide-gray-100 text-sm">
                  {[
                    ['Title', challengeData.title?.trim() || 'Not set'],
                    ['Type', formatDisplayLabel(challengeData.type)],
                    ['Difficulty', formatDisplayLabel(challengeData.difficulty)],
                    ['Category', formatDisplayLabel(challengeData.category)],
                    ['Duration', `${challengeData.duration} min`],
                    ['Rewards', `${challengeData.xpReward} XP · ${challengeData.reputationReward} rep`],
                    ['Total steps', String(challengeData.steps.length)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-0.5 py-3 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                      <dt className="shrink-0 text-gray-500">{label}</dt>
                      <dd className="font-medium text-gray-900 text-right break-words sm:max-w-[60%]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="h-5 w-5" aria-hidden />
                  </div>
                  <h4 className="font-semibold text-gray-800">Description</h4>
                </div>
                <div className="max-h-52 min-h-[7.5rem] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/90 px-4 py-3">
                  {challengeData.description?.trim() ? (
                    <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{challengeData.description}</p>
                  ) : (
                    <p className="text-sm italic text-gray-500">No description provided.</p>
                  )}
                </div>
              </div>
            </div>

            {challengeData.steps.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <ListOrdered className="h-5 w-5" aria-hidden />
                    </div>
                    <h4 className="font-semibold text-gray-800">Steps</h4>
                  </div>
                </div>
                <ul className="space-y-3">
                  {challengeData.steps.map((step, index) => (
                    <li
                      key={step.id}
                      className="flex gap-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 transition-colors hover:border-emerald-200/90"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold capitalize text-emerald-800">
                            {step.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{stepSummaryLine(step)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-xl">
      {/* Progress Bar */}
      {currentStep > 0 && (
        <div className="px-8 pt-6 pb-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className={`text-sm font-semibold ${currentStep >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                Basic Info
              </span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-300 rounded-full">
              <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-emerald-600' : 'bg-gray-300'}`} style={{ width: currentStep >= 2 ? '100%' : '0%' }}></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className={`text-sm font-semibold ${currentStep >= 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
                Add Steps
              </span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-300 rounded-full">
              <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-emerald-600' : 'bg-gray-300'}`} style={{ width: currentStep >= 3 ? '100%' : '0%' }}></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <span className={`text-sm font-semibold ${currentStep >= 3 ? 'text-emerald-600' : 'text-gray-400'}`}>
                Review
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Footer */}
      {currentStep > 0 && (
        <div className="p-8 border-t-2 bg-gray-50 flex justify-between rounded-b-xl">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(minStep, currentStep - 1))}
            disabled={currentStep <= minStep || isPublishing}
            className="flex items-center px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} className="mr-2" />
            Previous
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPublishing}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={tryAdvanceStep}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Next Step
                <ArrowRight size={20} className="ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isPublishing}
                aria-busy={isPublishing}
                className="flex items-center px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 disabled:cursor-not-allowed disabled:opacity-90"
              >
                {isPublishing ? (
                  <>
                    <Loader2 size={20} className="mr-2 shrink-0 animate-spin" aria-hidden />
                    {isEditMode ? 'Saving…' : 'Publishing…'}
                  </>
                ) : (
                  <>
                    <Check size={20} className="mr-2 shrink-0" strokeWidth={2.5} aria-hidden />
                    {isEditMode ? 'Save changes' : 'Publish Challenge'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

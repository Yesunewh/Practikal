import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Challenge, ChallengeStep, QuestionContent } from '../../types';
import { questionKindLabel } from '../../constants/questionKinds';
import ChallengeTypeTemplates from './ChallengeTypeTemplates';
import QuizBuilder from './builders/QuizBuilder';
import ScenarioBuilder from './builders/ScenarioBuilder';
import SequentialBuilder from './builders/SequentialBuilder';
import ImageVerificationBuilder from './builders/ImageVerificationBuilder';
import PasswordBuilder from './builders/PasswordBuilder';
import SimulationBuilder from './builders/SimulationBuilder';

interface CreateChallengeProps {
  onSave: (challenge: Partial<Challenge>) => void;
  onCancel: () => void;
}

type StepType = 'question' | 'information' | 'password-create' | 'scenario' | 'sequential' | 'image-verification';

function stepSummaryLine(step: ChallengeStep): string {
  if (step.type === 'question') {
    const c = step.content as QuestionContent;
    const kind = questionKindLabel(c.questionKind);
    const q = (c.question || '').trim() || 'Untitled';
    const short = q.length > 90 ? `${q.slice(0, 90)}…` : q;
    return `${kind}: ${short}`;
  }
  const raw = (step.content as { question?: string }).question;
  return raw || 'Untitled step';
}

export default function CreateChallenge({ onSave, onCancel }: CreateChallengeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showBuilder, setShowBuilder] = useState(false);
  const [challengeData, setChallengeData] = useState({
    title: '',
    description: '',
    type: 'quiz' as Challenge['type'],
    xpReward: 100,
    reputationReward: 5,
    duration: 10,
    difficulty: 'beginner' as Challenge['difficulty'],
    category: 'general' as Challenge['category'],
    steps: [] as ChallengeStep[]
  });

  const [currentStepData, setCurrentStepData] = useState<any>({
    type: 'question' as StepType,
    question: '',
    options: [{ id: '1', text: '', isCorrect: false }],
    explanation: ''
  });

  const handleBasicInfoChange = (field: string, value: any) => {
    setChallengeData({ ...challengeData, [field]: value });
  };

  const addOption = () => {
    setCurrentStepData({
      ...currentStepData,
      options: [...currentStepData.options, { id: Date.now().toString(), text: '', isCorrect: false }]
    });
  };

  const removeOption = (id: string) => {
    setCurrentStepData({
      ...currentStepData,
      options: currentStepData.options.filter((opt: any) => opt.id !== id)
    });
  };

  const updateOption = (id: string, field: string, value: any) => {
    setCurrentStepData({
      ...currentStepData,
      options: currentStepData.options.map((opt: any) => 
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    });
  };

  const addStepToChallenge = () => {
    const newStep: ChallengeStep = {
      id: Date.now().toString(),
      type: currentStepData.type,
      content: {
        question: currentStepData.question,
        options: currentStepData.options,
        multipleAnswers: false
      },
      explanation: currentStepData.explanation
    };

    setChallengeData({
      ...challengeData,
      steps: [...challengeData.steps, newStep]
    });

    // Reset step data
    setCurrentStepData({
      type: 'question',
      question: '',
      options: [{ id: '1', text: '', isCorrect: false }],
      explanation: ''
    });
  };

  const removeStep = (index: number) => {
    setChallengeData({
      ...challengeData,
      steps: challengeData.steps.filter((_, i) => i !== index)
    });
  };

  const handleSave = () => {
    // Validate that we have at least one step
    if (challengeData.steps.length === 0) {
      alert('Please add at least one step to your challenge before publishing.');
      return;
    }
    
    // Validate basic info
    if (!challengeData.title || !challengeData.description) {
      alert('Please fill in the title and description.');
      return;
    }
    
    onSave(challengeData);
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
          <ChallengeTypeTemplates
            onSelectType={handleTypeSelect}
            onBack={onCancel}
          />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.type}
                  onChange={(e) => handleBasicInfoChange('type', e.target.value)}
                >
                  <option value="quiz">Quiz</option>
                  <option value="scenario">Scenario</option>
                  <option value="password">Password</option>
                  <option value="simulation">Simulation</option>
                  <option value="sequential">Sequential</option>
                  <option value="verification">Verification</option>
                </select>
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

            {/* Current Step Being Created - OLD CODE REMOVED */}
            <div className="border rounded-lg p-6 bg-gray-50" style={{ display: 'none' }}>
              <h4 className="font-medium text-gray-700 mb-4">Create New Step</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Step Type</label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={currentStepData.type}
                    onChange={(e) => setCurrentStepData({ ...currentStepData, type: e.target.value })}
                  >
                    <option value="question">Multiple Choice Question</option>
                    <option value="information">Information</option>
                    <option value="scenario">Scenario</option>
                    <option value="sequential">Sequential Ordering</option>
                    <option value="image-verification">Image Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question/Prompt *</label>
                  <textarea
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                    placeholder="Enter your question..."
                    value={currentStepData.question}
                    onChange={(e) => setCurrentStepData({ ...currentStepData, question: e.target.value })}
                  />
                </div>

                {currentStepData.type === 'question' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                      <button
                        onClick={addOption}
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center font-medium"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Option
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {currentStepData.options.map((option: any, index: number) => (
                        <div key={option.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => updateOption(option.id, 'isCorrect', e.target.checked)}
                            className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={`Option ${index + 1}`}
                            value={option.text}
                            onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                          />
                          {currentStepData.options.length > 1 && (
                            <button
                              onClick={() => removeOption(option.id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✓ Check the box for correct answer(s)</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (optional)</label>
                  <textarea
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                    placeholder="Explain the correct answer..."
                    value={currentStepData.explanation}
                    onChange={(e) => setCurrentStepData({ ...currentStepData, explanation: e.target.value })}
                  />
                </div>

                <button
                  onClick={addStepToChallenge}
                  className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 flex items-center justify-center font-medium"
                  disabled={!currentStepData.question}
                >
                  <Plus size={18} className="mr-2" />
                  Add This Step to Challenge
                </button>
              </div>
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
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Review & Publish</h3>
              <p className="text-sm text-gray-500 mt-1">Review your challenge before publishing</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-4">Challenge Summary</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Title:</span>
                    <span className="font-medium text-right">{challengeData.title || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{challengeData.type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium capitalize">{challengeData.difficulty}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{challengeData.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{challengeData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Rewards:</span>
                    <span className="font-medium">{challengeData.xpReward} XP, {challengeData.reputationReward} Rep</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total Steps:</span>
                    <span className="font-medium">{challengeData.steps.length}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="font-medium text-gray-700 mb-4">Description</h4>
                <p className="text-sm text-gray-600">{challengeData.description || 'No description provided'}</p>
              </div>
            </div>

            {challengeData.steps.length > 0 && (
              <div className="border rounded-lg p-6">
                <h4 className="font-medium text-gray-700 mb-4">Steps Preview</h4>
                <div className="space-y-3">
                  {challengeData.steps.map((step, index) => (
                    <div key={step.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500">Step {index + 1}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                          {step.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{stepSummaryLine(step)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <div className="flex items-start">
                <Check className="text-emerald-600 mr-3 mt-0.5 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-medium text-emerald-800 text-lg">Ready to Publish</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Your challenge is ready to be published. Users will be able to access it immediately after you click the publish button.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black p-8 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Create New Challenge</h2>
            <p className="text-lime-300 text-base font-medium">
              {currentStep === 0 ? '🎯 Choose a challenge type' : `Step ${currentStep} of 3`}
            </p>
          </div>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>

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
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} className="mr-2" />
            Previous
          </button>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Next Step
                <ArrowRight size={20} className="ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-lime-500 to-emerald-600 text-black rounded-xl hover:from-lime-400 hover:to-emerald-500 font-bold shadow-xl hover:shadow-2xl transition-all"
              >
                <Check size={20} className="mr-2" />
                Publish Challenge
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

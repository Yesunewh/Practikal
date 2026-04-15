import { useState } from 'react';
import { X, Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Challenge, ChallengeStep } from '../../types';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challenge: Partial<Challenge>) => void;
}

type StepType = 'question' | 'information' | 'password-create' | 'scenario' | 'sequential' | 'image-verification';

export default function CreateChallengeModal({ isOpen, onClose, onSave }: CreateChallengeModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
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

  if (!isOpen) return null;

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
    onSave(challengeData);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challenge Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., Password Security Basics"
                value={challengeData.title}
                onChange={(e) => handleBasicInfoChange('title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                placeholder="Describe what users will learn..."
                value={challengeData.description}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.difficulty}
                  onChange={(e) => handleBasicInfoChange('difficulty', e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.duration}
                  onChange={(e) => handleBasicInfoChange('duration', parseInt(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.xpReward}
                  onChange={(e) => handleBasicInfoChange('xpReward', parseInt(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reputation Reward</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={challengeData.reputationReward}
                  onChange={(e) => handleBasicInfoChange('reputationReward', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Add Challenge Steps</h3>
              <span className="text-sm text-gray-500">{challengeData.steps.length} step(s) added</span>
            </div>

            {/* Current Step Being Created */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-3">Create New Step</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Step Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question/Prompt *</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={2}
                    placeholder="Enter your question..."
                    value={currentStepData.question}
                    onChange={(e) => setCurrentStepData({ ...currentStepData, question: e.target.value })}
                  />
                </div>

                {currentStepData.type === 'question' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                      <button
                        onClick={addOption}
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Option
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {currentStepData.options.map((option: any, index: number) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => updateOption(option.id, 'isCorrect', e.target.checked)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={`Option ${index + 1}`}
                            value={option.text}
                            onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                          />
                          {currentStepData.options.length > 1 && (
                            <button
                              onClick={() => removeOption(option.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Check the box for correct answer(s)</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={2}
                    placeholder="Explain the correct answer..."
                    value={currentStepData.explanation}
                    onChange={(e) => setCurrentStepData({ ...currentStepData, explanation: e.target.value })}
                  />
                </div>

                <button
                  onClick={addStepToChallenge}
                  className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center"
                  disabled={!currentStepData.question}
                >
                  <Plus size={16} className="mr-2" />
                  Add This Step to Challenge
                </button>
              </div>
            </div>

            {/* List of Added Steps */}
            {challengeData.steps.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Added Steps ({challengeData.steps.length})</h4>
                <div className="space-y-2">
                  {challengeData.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Step {index + 1}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {step.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {(step.content as any).question || 'Untitled step'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-700 ml-4"
                      >
                        <Trash2 size={16} />
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Review & Publish</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-3">Challenge Summary</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{challengeData.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{challengeData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="font-medium capitalize">{challengeData.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium capitalize">{challengeData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{challengeData.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rewards:</span>
                  <span className="font-medium">{challengeData.xpReward} XP, {challengeData.reputationReward} Rep</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Steps:</span>
                  <span className="font-medium">{challengeData.steps.length}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Description</h4>
              <p className="text-sm text-gray-600">{challengeData.description || 'No description provided'}</p>
            </div>

            {challengeData.steps.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Steps Preview</h4>
                <div className="space-y-2">
                  {challengeData.steps.map((step, index) => (
                    <div key={step.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">Step {index + 1}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {step.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {(step.content as any).question || 'Untitled step'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start">
                <Check className="text-emerald-600 mr-2 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-emerald-800">Ready to Publish</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Your challenge is ready to be published. Users will be able to access it immediately.
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Create New Challenge</h2>
            <p className="text-sm text-gray-500 mt-1">Step {currentStep} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
              Basic Info
            </span>
            <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
              Add Steps
            </span>
            <span className={`text-xs font-medium ${currentStep >= 3 ? 'text-emerald-600' : 'text-gray-400'}`}>
              Review
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} className="mr-2" />
            Previous
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Next
                <ArrowRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Check size={16} className="mr-2" />
                Publish Challenge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

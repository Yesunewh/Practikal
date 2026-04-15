import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface SequentialBuilderProps {
  onSave: (stepData: any) => void;
  onCancel: () => void;
}

export default function SequentialBuilder({ onSave, onCancel }: SequentialBuilderProps) {
  const [question, setQuestion] = useState('');
  const [steps, setSteps] = useState([
    { id: '1', text: '', correctPosition: 1 },
    { id: '2', text: '', correctPosition: 2 }
  ]);
  const [explanation, setExplanation] = useState('');

  const addStep = () => {
    setSteps([...steps, { 
      id: Date.now().toString(), 
      text: '', 
      correctPosition: steps.length + 1 
    }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 2) {
      const newSteps = steps.filter(s => s.id !== id);
      // Reorder positions
      newSteps.forEach((step, index) => {
        step.correctPosition = index + 1;
      });
      setSteps(newSteps);
    }
  };

  const updateStepText = (id: string, text: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, text } : s));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < steps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      // Update positions
      newSteps.forEach((step, idx) => {
        step.correctPosition = idx + 1;
      });
      setSteps(newSteps);
    }
  };

  const handleSave = () => {
    if (!question) {
      alert('Please enter a question');
      return;
    }

    if (steps.some(s => !s.text)) {
      alert('Please fill in all step texts');
      return;
    }

    const stepData = {
      type: 'sequential',
      content: {
        question,
        steps
      },
      explanation
    };

    onSave(stepData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Sequential Challenge Builder</h3>
        <p className="text-sm text-gray-500">Create a challenge where users arrange steps in correct order</p>
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Question/Instruction *</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={2}
          placeholder="e.g., Arrange these incident response steps in the correct order..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      {/* Steps */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">Steps to Order *</label>
          <button
            onClick={addStep}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center font-medium"
          >
            <Plus size={16} className="mr-1" />
            Add Step
          </button>
        </div>

        {/* Visual Preview */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4 text-center">
            Correct Order Preview
          </p>
          <div className="space-y-2 max-w-xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-3 bg-white border-2 border-emerald-300 rounded-lg p-4"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full font-bold">
                  {index + 1}
                </div>
                <span className="flex-1 text-gray-700">
                  {step.text || `Step ${index + 1} text...`}
                </span>
                <GripVertical size={20} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Step Inputs */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 p-4 border rounded-lg bg-white">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveStep(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >
                  ▲
                </button>
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                  {index + 1}
                </div>
                <button
                  onClick={() => moveStep(index, 'down')}
                  disabled={index === steps.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >
                  ▼
                </button>
              </div>
              
              <input
                type="text"
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={`Step ${index + 1} description...`}
                value={step.text}
                onChange={(e) => updateStepText(step.id, e.target.value)}
              />
              
              {steps.length > 2 && (
                <button
                  onClick={() => removeStep(step.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Remove step"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (optional)</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Explain the correct order..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          Add Sequential Step
        </button>
      </div>
    </div>
  );
}

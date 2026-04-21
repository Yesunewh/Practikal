import { useState } from 'react';
import { Plus, Trash2, Terminal, Mail, Shield, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface SimulationBuilderProps {
  onSave: (stepData: any) => void;
  onCancel: () => void;
}

export default function SimulationBuilder({ onSave, onCancel }: SimulationBuilderProps) {
  const [simulationType, setSimulationType] = useState<'email' | 'terminal' | 'firewall'>('email');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tasks, setTasks] = useState([
    { id: '1', description: '', correctAction: '', points: 10 }
  ]);
  const [explanation, setExplanation] = useState('');

  const addTask = () => {
    setTasks([...tasks, { 
      id: Date.now().toString(), 
      description: '', 
      correctAction: '', 
      points: 10 
    }]);
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const updateTask = (id: string, field: string, value: any) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSave = () => {
    if (!title.trim() || !instructions.trim()) {
      toast.error('Please fill in the title and instructions.');
      return;
    }

    if (tasks.some(t => !t.description.trim() || !t.correctAction.trim())) {
      toast.error('Please fill in all task descriptions and correct actions.');
      return;
    }

    const stepData = {
      type: 'simulation',
      content: {
        simulationType,
        title: title.trim(),
        instructions: instructions.trim(),
        tasks
      },
      explanation
    };

    onSave(stepData);
  };

  const getSimulationIcon = () => {
    switch (simulationType) {
      case 'email': return Mail;
      case 'terminal': return Terminal;
      case 'firewall': return Shield;
      default: return Terminal;
    }
  };

  const SimIcon = getSimulationIcon();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Simulation builder</h3>
        <p className="text-sm text-gray-500">
          Create hands-on, interactive cybersecurity training scenarios learners complete step by step.
        </p>
      </div>

      {/* Simulation Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Simulation type *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setSimulationType('email')}
            className={`p-6 border-2 rounded-xl transition-all ${
              simulationType === 'email'
                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <Mail size={32} className={`mx-auto mb-3 ${simulationType === 'email' ? 'text-emerald-600' : 'text-gray-400'}`} />
            <h4 className="font-bold text-gray-900 mb-1">Email security</h4>
            <p className="text-xs text-gray-600">Identify phishing emails</p>
          </button>

          <button
            type="button"
            onClick={() => setSimulationType('terminal')}
            className={`p-6 border-2 rounded-xl transition-all ${
              simulationType === 'terminal'
                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <Terminal size={32} className={`mx-auto mb-3 ${simulationType === 'terminal' ? 'text-emerald-600' : 'text-gray-400'}`} />
            <h4 className="font-bold text-gray-900 mb-1">Terminal commands</h4>
            <p className="text-xs text-gray-600">Practice security commands</p>
          </button>

          <button
            type="button"
            onClick={() => setSimulationType('firewall')}
            className={`p-6 border-2 rounded-xl transition-all ${
              simulationType === 'firewall'
                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <Shield size={32} className={`mx-auto mb-3 ${simulationType === 'firewall' ? 'text-emerald-600' : 'text-gray-400'}`} />
            <h4 className="font-bold text-gray-900 mb-1">Firewall config</h4>
            <p className="text-xs text-gray-600">Configure security rules</p>
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Simulation title *</label>
        <input
          type="text"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="e.g., Phishing Email Detection Lab"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Instructions *</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Explain what the user needs to do in this simulation..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      {/* Tasks */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">Tasks *</label>
          <button
            type="button"
            onClick={addTask}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center font-medium"
          >
            <Plus size={16} className="mr-1" />
            Add task
          </button>
        </div>

        {/* Preview */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4 text-center">
            Simulation preview
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl mx-auto border border-gray-100">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <SimIcon size={24} className="text-emerald-600" />
              <div>
                <h4 className="font-bold text-gray-900">{title || 'Simulation title'}</h4>
                <p className="text-sm text-gray-600">{simulationType.charAt(0).toUpperCase() + simulationType.slice(1)} simulation</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">{instructions || 'Instructions will appear here…'}</p>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Tasks</p>
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">
                    {task.description || `Task ${index + 1} description…`}
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-medium">
                    {task.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Inputs */}
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={task.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">Task {index + 1}</span>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Remove task"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Task description *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="What should the user do?"
                    value={task.description}
                    onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Correct action / answer *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="Expected user action"
                    value={task.correctAction}
                    onChange={(e) => updateTask(task.id, 'correctAction', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Points</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    value={task.points}
                    onChange={(e) => updateTask(task.id, 'points', parseInt(e.target.value, 10))}
                    min="1"
                  />
                </div>
              </div>
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
          placeholder="Explain the learning objectives and key takeaways..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
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
          Add simulation step
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Upload, X, Plus } from 'lucide-react';

interface ScenarioBuilderProps {
  onSave: (stepData: any) => void;
  onCancel: () => void;
}

export default function ScenarioBuilder({ onSave, onCancel }: ScenarioBuilderProps) {
  const [situation, setSituation] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [leftChoice, setLeftChoice] = useState({ text: '', consequence: '', isCorrect: false });
  const [rightChoice, setRightChoice] = useState({ text: '', consequence: '', isCorrect: false });
  const [explanation, setExplanation] = useState('');

  const handleSave = () => {
    if (!situation || !leftChoice.text || !rightChoice.text) {
      alert('Please fill in the situation and both choices');
      return;
    }

    if (!leftChoice.isCorrect && !rightChoice.isCorrect) {
      alert('Please mark at least one choice as correct');
      return;
    }

    const stepData = {
      type: 'scenario',
      content: {
        situation,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
        options: [
          { id: '1', text: leftChoice.text, isCorrect: leftChoice.isCorrect, consequence: leftChoice.consequence },
          { id: '2', text: rightChoice.text, isCorrect: rightChoice.isCorrect, consequence: rightChoice.consequence }
        ]
      },
      explanation
    };

    onSave(stepData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Scenario Challenge Builder</h3>
        <p className="text-sm text-gray-500">Create a decision-based scenario with visual content</p>
      </div>

      {/* Situation Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Situation Description *</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Describe the scenario situation..."
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
        />
      </div>

      {/* Media Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Media (Image or Video)</label>
        <div className="flex gap-4 mb-3">
          <button
            onClick={() => setMediaType('image')}
            className={`px-4 py-2 rounded-lg border-2 ${
              mediaType === 'image' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300'
            }`}
          >
            Image
          </button>
          <button
            onClick={() => setMediaType('video')}
            className={`px-4 py-2 rounded-lg border-2 ${
              mediaType === 'video' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300'
            }`}
          >
            Video
          </button>
        </div>
        <input
          type="text"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={`Enter ${mediaType} URL (e.g., https://example.com/image.jpg)`}
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
        />
        {mediaUrl && (
          <div className="mt-3 border rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
            ) : (
              <video src={mediaUrl} controls className="max-h-48 rounded-lg mx-auto" />
            )}
          </div>
        )}
      </div>

      {/* Layout Preview */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-4 text-center">Scenario Layout Preview</p>
        
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Left Choice */}
          <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-600">LEFT CHOICE</span>
              <input
                type="checkbox"
                checked={leftChoice.isCorrect}
                onChange={(e) => setLeftChoice({ ...leftChoice, isCorrect: e.target.checked })}
                className="h-4 w-4 text-emerald-600"
                title="Mark as correct"
              />
            </div>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
              placeholder="Choice text..."
              value={leftChoice.text}
              onChange={(e) => setLeftChoice({ ...leftChoice, text: e.target.value })}
            />
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-xs"
              rows={2}
              placeholder="Consequence..."
              value={leftChoice.consequence}
              onChange={(e) => setLeftChoice({ ...leftChoice, consequence: e.target.value })}
            />
          </div>

          {/* Center Media */}
          <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg p-6 h-48 flex items-center justify-center">
            {mediaUrl ? (
              mediaType === 'image' ? (
                <img src={mediaUrl} alt="Scenario" className="max-h-full rounded-lg" />
              ) : (
                <div className="text-center">
                  <Upload size={32} className="text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs text-emerald-700">Video will display here</p>
                </div>
              )
            ) : (
              <div className="text-center">
                <Upload size={32} className="text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-emerald-700">Image/Video</p>
                <p className="text-xs text-emerald-600">will appear here</p>
              </div>
            )}
          </div>

          {/* Right Choice */}
          <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-600">RIGHT CHOICE</span>
              <input
                type="checkbox"
                checked={rightChoice.isCorrect}
                onChange={(e) => setRightChoice({ ...rightChoice, isCorrect: e.target.checked })}
                className="h-4 w-4 text-emerald-600"
                title="Mark as correct"
              />
            </div>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
              placeholder="Choice text..."
              value={rightChoice.text}
              onChange={(e) => setRightChoice({ ...rightChoice, text: e.target.value })}
            />
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-xs"
              rows={2}
              placeholder="Consequence..."
              value={rightChoice.consequence}
              onChange={(e) => setRightChoice({ ...rightChoice, consequence: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (optional)</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Explain why the correct choice is best..."
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
          Add Scenario Step
        </button>
      </div>
    </div>
  );
}

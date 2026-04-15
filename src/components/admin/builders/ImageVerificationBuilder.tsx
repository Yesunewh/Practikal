import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface ImageVerificationBuilderProps {
  onSave: (stepData: any) => void;
  onCancel: () => void;
}

export default function ImageVerificationBuilder({ onSave, onCancel }: ImageVerificationBuilderProps) {
  const [question, setQuestion] = useState('');
  const [images, setImages] = useState([
    { id: '1', imageUrl: '', caption: '', isReal: true, explanation: '' },
    { id: '2', imageUrl: '', caption: '', isReal: false, explanation: '' }
  ]);
  const [multipleAnswers, setMultipleAnswers] = useState(true);
  const [explanation, setExplanation] = useState('');

  const addImage = () => {
    setImages([...images, { 
      id: Date.now().toString(), 
      imageUrl: '', 
      caption: '', 
      isReal: false, 
      explanation: '' 
    }]);
  };

  const removeImage = (id: string) => {
    if (images.length > 2) {
      setImages(images.filter(img => img.id !== id));
    }
  };

  const updateImage = (id: string, field: string, value: any) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, [field]: value } : img
    ));
  };

  const handleSave = () => {
    if (!question) {
      alert('Please enter a question');
      return;
    }

    if (images.some(img => !img.imageUrl)) {
      alert('Please provide URLs for all images');
      return;
    }

    const stepData = {
      type: 'image-verification',
      content: {
        question,
        images,
        multipleAnswers
      },
      explanation
    };

    onSave(stepData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Image Verification Builder</h3>
        <p className="text-sm text-gray-500">Create visual identification challenges (e.g., spot phishing websites)</p>
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Question *</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={2}
          placeholder="e.g., Which of these website screenshots are legitimate?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      {/* Multiple Selection Toggle */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="multipleSelection"
          checked={multipleAnswers}
          onChange={(e) => setMultipleAnswers(e.target.checked)}
          className="h-5 w-5 text-emerald-600"
        />
        <label htmlFor="multipleSelection" className="text-sm font-medium text-gray-700">
          Allow selecting multiple images
        </label>
      </div>

      {/* Images */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">Images *</label>
          <button
            onClick={addImage}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center font-medium"
          >
            <Plus size={16} className="mr-1" />
            Add Image
          </button>
        </div>

        {/* Visual Preview */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4 text-center">
            Image Grid Preview
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`border-4 rounded-lg overflow-hidden ${
                  image.isReal ? 'border-green-400' : 'border-red-400'
                }`}
              >
                {image.imageUrl ? (
                  <img 
                    src={image.imageUrl} 
                    alt={image.caption} 
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-600 truncate">
                    {image.caption || 'No caption'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {image.isReal ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                        ✓ Legitimate
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                        ✗ Phishing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Inputs */}
        <div className="space-y-4">
          {images.map((image, index) => (
            <div key={image.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">Image {index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={image.isReal}
                      onChange={(e) => updateImage(image.id, 'isReal', e.target.checked)}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as Legitimate
                    </span>
                  </label>
                  {images.length > 2 && (
                    <button
                      onClick={() => removeImage(image.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Image URL *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="https://example.com/image.jpg"
                    value={image.imageUrl}
                    onChange={(e) => updateImage(image.id, 'imageUrl', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Brief description..."
                    value={image.caption}
                    onChange={(e) => updateImage(image.id, 'caption', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Explanation</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  rows={2}
                  placeholder="Explain why this is legitimate or phishing..."
                  value={image.explanation}
                  onChange={(e) => updateImage(image.id, 'explanation', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">General Explanation (optional)</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Overall tips for identifying legitimate vs phishing content..."
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
          Add Image Verification Step
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { FileText, AlertTriangle, Lock, List, Image as ImageIcon, HelpCircle, ArrowRight, Check } from 'lucide-react';

interface ChallengeTypeTemplatesProps {
  onSelectType: (type: string) => void;
  onBack: () => void;
}

interface ChallengeTypeTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  preview: string;
  features: string[];
  bestFor: string;
}

const typeTemplates: ChallengeTypeTemplate[] = [
  {
    id: 'quiz',
    name: 'Quiz Challenge',
    description: 'Multiple choice questions with single or multiple correct answers',
    icon: HelpCircle,
    preview: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&h=250&fit=crop',
    features: [
      'Multiple choice questions',
      'Single or multiple correct answers',
      'Instant feedback',
      'Explanation after answer'
    ],
    bestFor: 'Testing knowledge and understanding of concepts'
  },
  {
    id: 'scenario',
    name: 'Scenario Challenge',
    description: 'Real-world situations with decision-based choices',
    icon: AlertTriangle,
    preview: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop',
    features: [
      'Image/video in center',
      'Choices on left and right',
      'Consequence feedback',
      'Real-world situations'
    ],
    bestFor: 'Decision-making and critical thinking scenarios'
  },
  {
    id: 'password',
    name: 'Password Challenge',
    description: 'Interactive password creation with real-time validation',
    icon: Lock,
    preview: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=250&fit=crop',
    features: [
      'Real-time strength meter',
      'Requirement checklist',
      'Visual feedback',
      'Security tips'
    ],
    bestFor: 'Teaching password security and best practices'
  },
  {
    id: 'sequential',
    name: 'Sequential Challenge',
    description: 'Drag and drop steps in correct order',
    icon: List,
    preview: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=250&fit=crop',
    features: [
      'Drag and drop interface',
      'Visual step ordering',
      'Numbered sequence',
      'Process learning'
    ],
    bestFor: 'Teaching procedures and correct order of operations'
  },
  {
    id: 'verification',
    name: 'Image Verification',
    description: 'Identify legitimate vs fake/phishing content',
    icon: ImageIcon,
    preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    features: [
      'Side-by-side image comparison',
      'Click to select/deselect',
      'Visual indicators',
      'Detailed explanations'
    ],
    bestFor: 'Visual identification and phishing detection'
  },
  {
    id: 'simulation',
    name: 'Interactive Simulation',
    description: 'Hands-on practice in simulated environment',
    icon: FileText,
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    features: [
      'Interactive environment',
      'Step-by-step guidance',
      'Real-world tools',
      'Practical experience'
    ],
    bestFor: 'Hands-on technical skills and tool usage'
  }
];

export default function ChallengeTypeTemplates({ onSelectType, onBack }: ChallengeTypeTemplatesProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      onSelectType(selectedType);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-8 text-white">
        <h3 className="text-3xl font-bold mb-3">Choose Challenge Type</h3>
        <p className="text-emerald-100 text-lg">Select the type of challenge you want to create. Each type has a unique layout and interaction style.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {typeTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedType === template.id;
          const isHovered = hoveredType === template.id;
          
          return (
            <div
              key={template.id}
              onClick={() => setSelectedType(template.id)}
              onMouseEnter={() => setHoveredType(template.id)}
              onMouseLeave={() => setHoveredType(null)}
              className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? 'border-lime-400 shadow-xl scale-105 ring-4 ring-lime-400/20'
                  : isHovered
                  ? 'border-emerald-400 shadow-lg'
                  : 'border-gray-200 hover:shadow-md hover:border-gray-300'
              }`}
            >
              {/* Preview Image */}
              <div className="relative h-40 bg-gradient-to-br from-emerald-400 to-emerald-600 overflow-hidden">
                <img 
                  src={template.preview} 
                  alt={template.name}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-lg">
                  <Icon size={24} className="text-emerald-600" />
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-lime-400 rounded-full p-2 shadow-lg">
                    <Check size={20} className="text-black font-bold" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                <h4 className="font-bold text-xl text-gray-900 mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{template.description}</p>
                
                <div className="mb-5">
                  <p className="text-xs font-bold text-emerald-700 uppercase mb-3 tracking-wide">Key Features:</p>
                  <ul className="space-y-2">
                    {template.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start">
                        <span className="text-lime-500 mr-2 font-bold text-base">✓</span>
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-emerald-700">Perfect for:</span> {template.bestFor}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Type Details */}
      {selectedType && (
        <div className="bg-gradient-to-r from-lime-50 to-emerald-50 border-2 border-lime-300 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md">
              {(() => {
                const template = typeTemplates.find(t => t.id === selectedType);
                const Icon = template?.icon;
                return Icon ? <Icon size={36} className="text-emerald-600" /> : null;
              })()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Check size={20} className="text-lime-600" />
                <h4 className="font-bold text-xl text-gray-900">
                  {typeTemplates.find(t => t.id === selectedType)?.name} Selected
                </h4>
              </div>
              <p className="text-gray-700 text-base mb-3">
                {typeTemplates.find(t => t.id === selectedType)?.description}
              </p>
              <p className="text-emerald-700 text-sm font-medium">
                → Click "Continue" to start building your {typeTemplates.find(t => t.id === selectedType)?.name.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t-2">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
        
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className="flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:hover:shadow-xl"
        >
          Continue with {selectedType && typeTemplates.find(t => t.id === selectedType)?.name}
          <ArrowRight size={22} className="ml-2" />
        </button>
      </div>
    </div>
  );
}

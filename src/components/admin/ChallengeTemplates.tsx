import { useState } from 'react';
import { Challenge, ChallengeStep } from '../../types';
import { FileText, Shield, Lock, Image, List, AlertTriangle, ArrowRight, Check } from 'lucide-react';

interface ChallengeTemplatesProps {
  onSelectTemplate: (template: Partial<Challenge>) => void;
  onSkip: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  type: Challenge['type'];
  category: Challenge['category'];
  difficulty: Challenge['difficulty'];
  duration: number;
  xpReward: number;
  reputationReward: number;
  steps: ChallengeStep[];
}

const templates: Template[] = [
  {
    id: 'phishing-email',
    name: 'Phishing Email Detection',
    description: 'Teach users to identify phishing emails with multiple choice questions',
    icon: Shield,
    type: 'quiz',
    category: 'phishing',
    difficulty: 'beginner',
    duration: 10,
    xpReward: 100,
    reputationReward: 5,
    steps: [
      {
        id: '1',
        type: 'information',
        content: {
          title: 'Introduction to Phishing',
          description: 'Phishing is a type of social engineering attack where attackers try to trick you into revealing sensitive information. In this challenge, you\'ll learn to identify common phishing tactics.'
        }
      },
      {
        id: '2',
        type: 'question',
        content: {
          question: 'Which of the following are signs of a phishing email?',
          options: [
            { id: '1', text: 'Urgent language requiring immediate action', isCorrect: true },
            { id: '2', text: 'Generic greetings like "Dear Customer"', isCorrect: true },
            { id: '3', text: 'Personalized greeting with your name', isCorrect: false },
            { id: '4', text: 'Suspicious links or attachments', isCorrect: true }
          ],
          multipleAnswers: true
        },
        explanation: 'Phishing emails often use urgent language, generic greetings, and suspicious links to trick victims.'
      }
    ]
  },
  {
    id: 'password-security',
    name: 'Password Security Challenge',
    description: 'Interactive password creation with real-time validation',
    icon: Lock,
    type: 'password',
    category: 'password',
    difficulty: 'beginner',
    duration: 15,
    xpReward: 150,
    reputationReward: 8,
    steps: [
      {
        id: '1',
        type: 'information',
        content: {
          title: 'Creating Strong Passwords',
          description: 'A strong password is your first line of defense. Learn the requirements for creating secure passwords that protect your accounts.'
        }
      },
      {
        id: '2',
        type: 'password-create',
        content: {
          minLength: 12,
          requireCapital: true,
          requireNumber: true,
          requireSpecial: true
        },
        explanation: 'Strong passwords should be at least 12 characters long and include uppercase letters, numbers, and special characters.'
      }
    ]
  },
  {
    id: 'incident-response',
    name: 'Incident Response Scenario',
    description: 'Decision-based scenario for handling security incidents',
    icon: AlertTriangle,
    type: 'scenario',
    category: 'incident-response',
    difficulty: 'intermediate',
    duration: 20,
    xpReward: 200,
    reputationReward: 10,
    steps: [
      {
        id: '1',
        type: 'information',
        content: {
          title: 'Security Incident Response',
          description: 'When a security incident occurs, quick and correct action is crucial. This scenario will test your decision-making skills.'
        }
      },
      {
        id: '2',
        type: 'scenario',
        content: {
          situation: 'You receive an alert that an employee\'s account is showing unusual login activity from a foreign country. What should you do first?',
          options: [
            {
              id: '1',
              text: 'Immediately disable the account',
              isCorrect: true,
              consequence: 'Correct! Disabling the account prevents further unauthorized access while you investigate.'
            },
            {
              id: '2',
              text: 'Send an email to the employee asking if they are traveling',
              isCorrect: false,
              consequence: 'This delays response time. The account could be compromised and used for malicious activities.'
            },
            {
              id: '3',
              text: 'Ignore it, employees travel all the time',
              isCorrect: false,
              consequence: 'This is dangerous! Unusual activity should always be investigated immediately.'
            }
          ]
        },
        explanation: 'In incident response, containment is the first priority to prevent further damage.'
      }
    ]
  },
  {
    id: 'sequential-steps',
    name: 'Security Process Steps',
    description: 'Teach correct order of security procedures',
    icon: List,
    type: 'sequential',
    category: 'general',
    difficulty: 'intermediate',
    duration: 15,
    xpReward: 150,
    reputationReward: 8,
    steps: [
      {
        id: '1',
        type: 'information',
        content: {
          title: 'Security Procedures',
          description: 'Following the correct order of security procedures is critical for effective incident response.'
        }
      },
      {
        id: '2',
        type: 'sequential',
        content: {
          question: 'Arrange these incident response steps in the correct order:',
          steps: [
            { id: '1', text: 'Identify the incident', correctPosition: 1 },
            { id: '2', text: 'Contain the threat', correctPosition: 2 },
            { id: '3', text: 'Eradicate the threat', correctPosition: 3 },
            { id: '4', text: 'Recover systems', correctPosition: 4 },
            { id: '5', text: 'Document lessons learned', correctPosition: 5 }
          ]
        },
        explanation: 'The incident response lifecycle follows: Identify → Contain → Eradicate → Recover → Learn.'
      }
    ]
  },
  {
    id: 'image-verification',
    name: 'Phishing Website Detection',
    description: 'Visual identification of legitimate vs phishing websites',
    icon: Image,
    type: 'verification',
    category: 'phishing',
    difficulty: 'advanced',
    duration: 20,
    xpReward: 250,
    reputationReward: 12,
    steps: [
      {
        id: '1',
        type: 'information',
        content: {
          title: 'Visual Phishing Detection',
          description: 'Phishing websites often look very similar to legitimate sites. Learn to spot the subtle differences.'
        }
      },
      {
        id: '2',
        type: 'image-verification',
        content: {
          question: 'Which of these website screenshots are legitimate?',
          images: [
            {
              id: '1',
              imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
              caption: 'Banking login page',
              isReal: true,
              explanation: 'This is a legitimate banking page with proper HTTPS and verified domain.'
            },
            {
              id: '2',
              imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
              caption: 'Email verification page',
              isReal: false,
              explanation: 'This is a phishing page - notice the suspicious URL and poor design quality.'
            }
          ],
          multipleAnswers: true
        },
        explanation: 'Always check the URL, look for HTTPS, and verify the domain matches the official website.'
      }
    ]
  },
  {
    id: 'malware-quiz',
    name: 'Malware Awareness Quiz',
    description: 'Multiple choice questions about malware types and prevention',
    icon: Shield,
    type: 'quiz',
    category: 'malware',
    difficulty: 'intermediate',
    duration: 15,
    xpReward: 175,
    reputationReward: 9,
    steps: [
      {
        id: '1',
        type: 'information',
        content: {
          title: 'Understanding Malware',
          description: 'Malware comes in many forms - viruses, trojans, ransomware, and more. Understanding these threats is key to prevention.'
        }
      },
      {
        id: '2',
        type: 'question',
        content: {
          question: 'What is ransomware?',
          options: [
            { id: '1', text: 'Software that encrypts your files and demands payment', isCorrect: true },
            { id: '2', text: 'Software that steals passwords', isCorrect: false },
            { id: '3', text: 'Software that displays advertisements', isCorrect: false },
            { id: '4', text: 'Software that monitors your activity', isCorrect: false }
          ],
          multipleAnswers: false
        },
        explanation: 'Ransomware encrypts files and demands payment (ransom) for the decryption key.'
      },
      {
        id: '3',
        type: 'question',
        content: {
          question: 'Which of these are best practices to prevent malware?',
          options: [
            { id: '1', text: 'Keep software updated', isCorrect: true },
            { id: '2', text: 'Use antivirus software', isCorrect: true },
            { id: '3', text: 'Open all email attachments', isCorrect: false },
            { id: '4', text: 'Download from trusted sources only', isCorrect: true }
          ],
          multipleAnswers: true
        },
        explanation: 'Prevention includes keeping software updated, using antivirus, and being cautious with downloads.'
      }
    ]
  }
];

export default function ChallengeTemplates({ onSelectTemplate, onSkip }: ChallengeTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleUseTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      onSelectTemplate({
        title: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        difficulty: template.difficulty,
        duration: template.duration,
        xpReward: template.xpReward,
        reputationReward: template.reputationReward,
        steps: template.steps
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Choose a Template</h3>
        <p className="text-sm text-gray-500">Start with a pre-built template or create from scratch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg ${
                  selectedTemplate === template.id ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  <Icon size={24} className={selectedTemplate === template.id ? 'text-emerald-600' : 'text-gray-600'} />
                </div>
                {selectedTemplate === template.id && (
                  <div className="bg-emerald-500 rounded-full p-1">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium capitalize">{template.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Difficulty:</span>
                  <span className={`px-2 py-0.5 rounded font-medium ${
                    template.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                    template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {template.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Steps:</span>
                  <span className="font-medium">{template.steps.length} steps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Rewards:</span>
                  <span className="font-medium">{template.xpReward} XP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onSkip}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          Start from scratch instead
        </button>
        
        <button
          onClick={handleUseTemplate}
          disabled={!selectedTemplate}
          className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Use This Template
          <ArrowRight size={18} className="ml-2" />
        </button>
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">Template Preview</h4>
          {templates.find(t => t.id === selectedTemplate)?.steps.map((step, index) => (
            <div key={step.id} className="mb-2 text-sm">
              <span className="text-blue-700 font-medium">Step {index + 1}:</span>
              <span className="text-blue-800 ml-2">
                {step.type === 'information' ? (step.content as any).title : 
                 step.type === 'question' ? (step.content as any).question :
                 step.type === 'scenario' ? (step.content as any).situation :
                 step.type === 'sequential' ? (step.content as any).question :
                 'Step content'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

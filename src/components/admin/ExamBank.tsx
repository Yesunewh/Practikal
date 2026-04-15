import { useState } from 'react';
import { User } from '../../types';
import { Search, Edit, Trash2, PlusCircle, ChevronDown, FileText, Clock, Award } from 'lucide-react';

interface ExamBankProps {
  currentUser: User;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  attempts: number;
}

const mockExams: Exam[] = [
  {
    id: '1',
    title: 'Cybersecurity Fundamentals Exam',
    description: 'Comprehensive exam covering basic cybersecurity concepts',
    duration: 60,
    totalQuestions: 50,
    passingScore: 70,
    difficulty: 'beginner',
    category: 'General Security',
    status: 'active',
    createdAt: '2024-01-15',
    attempts: 245
  },
  {
    id: '2',
    title: 'Advanced Phishing Detection',
    description: 'Test your ability to identify sophisticated phishing attempts',
    duration: 45,
    totalQuestions: 30,
    passingScore: 75,
    difficulty: 'advanced',
    category: 'Phishing',
    status: 'active',
    createdAt: '2024-02-10',
    attempts: 128
  },
  {
    id: '3',
    title: 'Password Security Best Practices',
    description: 'Exam on password creation and management',
    duration: 30,
    totalQuestions: 25,
    passingScore: 80,
    difficulty: 'intermediate',
    category: 'Password Security',
    status: 'active',
    createdAt: '2024-03-05',
    attempts: 312
  }
];

export default function ExamBank({ currentUser }: ExamBankProps) {
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDifficulty = filterDifficulty === 'all' || exam.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const handleDeleteExam = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      setExams(exams.filter(exam => exam.id !== examId));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'text-green-700 bg-green-100';
      case 'intermediate': return 'text-yellow-700 bg-yellow-100';
      case 'advanced': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'draft': return 'text-gray-700 bg-gray-100';
      case 'archived': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Exam Bank</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage certification exams</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
        >
          <PlusCircle size={16} className="mr-2" />
          Create Exam
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search exams..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* Exam table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExams.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FileText size={20} className="text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                      <div className="text-xs text-gray-500">{exam.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      {exam.duration} min
                    </div>
                    <div className="flex items-center">
                      <FileText size={14} className="mr-1" />
                      {exam.totalQuestions} questions
                    </div>
                    <div className="flex items-center">
                      <Award size={14} className="mr-1" />
                      {exam.passingScore}% pass
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(exam.difficulty)}`}>
                    {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(exam.status)}`}>
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{exam.attempts}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit exam"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete exam"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredExams.length}</span> of <span className="font-medium">{exams.length}</span> exams
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <button className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
      
      {/* Add Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Create New Exam</h3>
            <p className="text-gray-500 mb-4">Exam creation form would be implemented here with fields for:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-6">
              <li>Exam title and description</li>
              <li>Duration and total questions</li>
              <li>Passing score percentage</li>
              <li>Difficulty level and category</li>
              <li>Question bank selection</li>
              <li>Randomization settings</li>
            </ul>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Create Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

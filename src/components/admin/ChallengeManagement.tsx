import { useState } from 'react';
import { User, Challenge } from '../../types';
import { Search, Edit, Trash2, PlusCircle, ChevronDown, Award, FileText } from 'lucide-react';
import { useChallenges } from '../../context/ChallengeContext';
import CreateChallenge from './CreateChallenge';

interface ChallengeManagementProps {
  currentUser: User;
}

export default function ChallengeManagement({ currentUser }: ChallengeManagementProps) {
  const { challenges: allChallenges, addChallenge, deleteChallenge: removeChallengeFromContext } = useChallenges();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  
  const filteredChallenges = allChallenges.filter(challenge => {
    // Filter by search query
    const matchesSearch = 
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by type
    const matchesType = filterType === 'all' || challenge.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleDeleteChallenge = (challengeId: string) => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      removeChallengeFromContext(challengeId);
    }
  };
  
  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    // In a real app, this would open an edit modal
    console.log('Editing challenge:', challenge);
  };

  const handleSaveChallenge = (newChallenge: Partial<Challenge>) => {
    const challenge: Challenge = {
      id: Date.now().toString(),
      title: newChallenge.title || '',
      description: newChallenge.description || '',
      type: newChallenge.type || 'quiz',
      xpReward: newChallenge.xpReward || 100,
      reputationReward: newChallenge.reputationReward || 5,
      duration: newChallenge.duration || 10,
      difficulty: newChallenge.difficulty || 'beginner',
      category: newChallenge.category || 'general',
      steps: newChallenge.steps || [],
      completed: false
    };
    
    addChallenge(challenge); // Add to global context
    setIsCreating(false); // Close the creation view and return to list
  };
  
  const getChallengeTypeColor = (type: string) => {
    switch(type) {
      case 'quiz': return 'text-blue-700 bg-blue-100';
      case 'scenario': return 'text-purple-700 bg-purple-100';
      case 'password': return 'text-green-700 bg-green-100';
      case 'simulation': return 'text-amber-700 bg-amber-100';
      case 'sequential': return 'text-indigo-700 bg-indigo-100';
      case 'verification': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Get unique challenge types for the filter dropdown
  const challengeTypes = ['all', ...Array.from(new Set(allChallenges.map(c => c.type)))];

  // Show create challenge view if creating
  if (isCreating) {
    return (
      <CreateChallenge
        onSave={handleSaveChallenge}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-lg font-semibold text-gray-800">Challenge Management</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
        >
          <PlusCircle size={16} className="mr-2" />
          Create Challenge
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search challenges..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              {challengeTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* Challenge table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChallenges.map((challenge) => (
              <tr key={challenge.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <FileText size={20} className="text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{challenge.title}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{challenge.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getChallengeTypeColor(challenge.type)}`}>
                    {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Award size={16} className="text-amber-500 mr-1" />
                    <span className="text-sm text-gray-900">{challenge.xpReward} XP</span>
                  </div>
                  {challenge.reputationReward && (
                    <div className="flex items-center mt-1">
                      <Award size={16} className="text-blue-500 mr-1" />
                      <span className="text-xs text-gray-500">{challenge.reputationReward} Reputation</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => handleEditChallenge(challenge)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteChallenge(challenge.id)}
                      className="text-red-600 hover:text-red-900"
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
          Showing <span className="font-medium">{filteredChallenges.length}</span> of <span className="font-medium">{allChallenges.length}</span> challenges
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
      
    </div>
  );
}

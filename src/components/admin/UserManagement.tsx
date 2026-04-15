import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { Search, Edit, Trash2, UserPlus, Filter, MoreVertical, ChevronDown, Check } from 'lucide-react';
import { mockUser, mockAdmin, mockSuperAdmin } from '../../data/mockData';

interface UserManagementProps {
  currentUser: User;
}

// Sample users for the user management table
const sampleUsers: User[] = [
  mockUser,
  mockAdmin,
  mockSuperAdmin,
  {
    ...mockUser,
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    rank: {
      ...mockUser.rank,
      current: 'medior',
      next: 'senior',
      progress: 60
    }
  },
  {
    ...mockUser,
    id: '3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    rank: {
      ...mockUser.rank,
      current: 'senior',
      next: 'professional',
      progress: 45
    }
  }
];

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(sampleUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const isSuperAdmin = currentUser.role === 'superadmin';
  
  const filteredUsers = users.filter(user => {
    // Filter by search query
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by role
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // In a real app, this would open an edit modal
    console.log('Editing user:', user);
  };
  
  const getRoleColor = (role: UserRole) => {
    switch(role) {
      case 'superadmin': return 'text-red-700 bg-red-100';
      case 'admin': return 'text-blue-700 bg-blue-100';
      default: return 'text-green-700 bg-green-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
        <button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
        >
          <UserPlus size={16} className="mr-2" />
          Add User
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value as UserRole | 'all')}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              {isSuperAdmin && <option value="superadmin">Super Admin</option>}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* User table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.organization}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 capitalize">{user.rank.current}</div>
                  <div className="text-xs text-gray-500">{user.rank.progress}% to {user.rank.next}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    {/* Only allow deletion of regular users by admins, and other admins by superadmins */}
                    {(user.role === 'user' || (user.role === 'admin' && currentUser.role === 'superadmin')) && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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
          Showing <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
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
      
      {/* Add User Modal would be here in a real implementation */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <p className="text-gray-500">User creation modal would be implemented here.</p>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsAddUserModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 mr-2"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Add user logic would go here
                  setIsAddUserModalOpen(false);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

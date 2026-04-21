import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import { LayoutDashboard, Users, BookOpen, BarChart2, Settings, Shield, Building2 } from 'lucide-react';


interface AdminNavigationProps {
  currentUser: User;
}

export default function AdminNavigation({ currentUser }: AdminNavigationProps) {
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
  
  if (!isAdmin) {
    return null; // Don't show admin navigation for regular users
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col space-y-2">
        <h3 className="font-semibold text-lg text-gray-800 px-3 mb-2">Admin</h3>
        
        <Link 
          to="/admin" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <LayoutDashboard size={18} className="mr-3" />
          Dashboard
        </Link>
        
        <Link 
          to="/admin/users" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <Users size={18} className="mr-3" />
          User Management
        </Link>
        
        <Link 
          to="/admin/challenges" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <BookOpen size={18} className="mr-3" />
          Challenges &amp; exam bank
        </Link>
        
        <Link 
          to="/admin/reports" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <BarChart2 size={18} className="mr-3" />
          Training reports
        </Link>
        
        {isSuperAdmin && (
          <Link 
            to="/admin/organizations" 
            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
          >
            <Building2 size={18} className="mr-3" />
            Organizations
          </Link>
        )}

        {isSuperAdmin && (
          <Link 
            to="/admin/settings" 
            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
          >
            <Settings size={18} className="mr-3" />
            System Settings
          </Link>
        )}

        
        {isSuperAdmin && (
          <Link 
            to="/admin/admins" 
            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
          >
            <Shield size={18} className="mr-3" />
            Admin Management
          </Link>
        )}
      </div>
    </div>
  );
}

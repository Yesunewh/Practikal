import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import { LayoutDashboard, Users, BookOpen, BarChart2, Shield, Building2, Layers } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';


interface AdminNavigationProps {
  currentUser: User;
}

export default function AdminNavigation({ currentUser }: AdminNavigationProps) {
  const { messages } = useI18n();
  const nav = messages.nav.items;
  const pageTitles = messages.pageTitles;
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
  
  if (!isAdmin) {
    return null; // Don't show admin navigation for regular users
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col space-y-2">
        <h3 className="font-semibold text-lg text-gray-800 px-3 mb-2">{nav.adminNavHeading}</h3>
        
        <Link 
          to="/admin" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <LayoutDashboard size={18} className="mr-3" />
          {pageTitles.fallback}
        </Link>
        
        <Link 
          to="/admin/users" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <Users size={18} className="mr-3" />
          {nav.adminUsers}
        </Link>
        
        <Link 
          to="/admin/challenges" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <BookOpen size={18} className="mr-3" />
          {nav.adminChallenges}
        </Link>
        
        <Link 
          to="/admin/reports" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
        >
          <BarChart2 size={18} className="mr-3" />
          {nav.adminReports}
        </Link>
        
        {isSuperAdmin && (
          <Link 
            to="/admin/organizations" 
            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
          >
            <Building2 size={18} className="mr-3" />
            {nav.adminOrganizations}
          </Link>
        )}

        {isSuperAdmin && (
          <Link 
            to="/admin/categories" 
            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
          >
            <Layers size={18} className="mr-3" />
            {nav.adminCategories}
          </Link>
        )}

        {isSuperAdmin && (
          <Link 
            to="/admin/admins" 
            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
          >
            <Shield size={18} className="mr-3" />
            {nav.adminAdmins}
          </Link>
        )}
      </div>
    </div>
  );
}

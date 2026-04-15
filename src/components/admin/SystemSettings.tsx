import React, { useState } from 'react';
import { User } from '../../types';
import { Save, RefreshCw, AlertTriangle, Shield, Database, Lock, Globe, Server } from 'lucide-react';

interface SystemSettingsProps {
  currentUser: User;
}

export default function SystemSettings({ currentUser }: SystemSettingsProps) {
  const isSuperAdmin = currentUser.role === 'superadmin';
  
  // Redirect non-super admin users
  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <Shield className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
            <p className="text-gray-500">You need Super Admin privileges to access system settings.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // State for form values
  const [settings, setSettings] = useState({
    siteName: 'Practikal',
    siteDescription: 'Cybersecurity Learning Platform',
    enableRegistration: true,
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    maintenanceMode: false,
    maxUsers: 5000,
    backupFrequency: 'daily',
    loggingLevel: 'info',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save the settings to a database
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-800">System Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">Configure global system settings (Super Admin only)</p>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Globe className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  name="siteName"
                  id="siteName"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={settings.siteName}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Description
                </label>
                <input
                  type="text"
                  name="siteDescription"
                  id="siteDescription"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={settings.siteDescription}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Security Settings */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center mb-4">
              <Lock className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="enableRegistration" className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableRegistration"
                    id="enableRegistration"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    checked={settings.enableRegistration}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable User Registration</span>
                </label>
              </div>
              
              <div>
                <label htmlFor="requireEmailVerification" className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    id="requireEmailVerification"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    checked={settings.requireEmailVerification}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Require Email Verification</span>
                </label>
              </div>
              
              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  name="sessionTimeout"
                  id="sessionTimeout"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={settings.sessionTimeout}
                  onChange={handleChange}
                  min="5"
                  max="120"
                />
              </div>
              
              <div>
                <label htmlFor="maxLoginAttempts" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  name="maxLoginAttempts"
                  id="maxLoginAttempts"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={settings.maxLoginAttempts}
                  onChange={handleChange}
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>
          
          {/* System Settings */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center mb-4">
              <Server className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="maintenanceMode" className="flex items-center">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    id="maintenanceMode"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Maintenance Mode</span>
                </label>
              </div>
              
              <div>
                <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Users
                </label>
                <input
                  type="number"
                  name="maxUsers"
                  id="maxUsers"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={settings.maxUsers}
                  onChange={handleChange}
                  min="100"
                />
              </div>
              
              <div>
                <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Database Backup Frequency
                </label>
                <select
                  name="backupFrequency"
                  id="backupFrequency"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={settings.backupFrequency}
                  onChange={handleChange}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="loggingLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Logging Level
                </label>
                <select
                  name="loggingLevel"
                  id="loggingLevel"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={settings.loggingLevel}
                  onChange={handleChange}
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="pt-6 border-t flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <RefreshCw className="h-4 w-4 inline-block mr-1" />
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Save className="h-4 w-4 inline-block mr-1" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
      
      {/* Danger Zone */}
      <div className="p-6 mt-6 border-t border-red-100 bg-red-50">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-md">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Clear All User Data</h4>
              <p className="text-xs text-gray-500">This will permanently delete all user data and cannot be undone.</p>
            </div>
            <button className="px-3 py-1 bg-white border border-red-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
              Clear Data
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-md">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Reset System</h4>
              <p className="text-xs text-gray-500">This will reset all system settings to default values.</p>
            </div>
            <button className="px-3 py-1 bg-white border border-red-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
              Reset System
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-md">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Export All Data</h4>
              <p className="text-xs text-gray-500">Download a complete backup of all system data.</p>
            </div>
            <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

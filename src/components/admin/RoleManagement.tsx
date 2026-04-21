import { useState } from 'react';
import { useGetRolesQuery, useGetAvailablePermissionsQuery, useCreateRoleMutation } from '../../store/apiSlice/practikalApi';
import { Lock, Plus, Shield } from 'lucide-react';
import { User } from '../../types';

interface RoleManagementProps {
  currentUser: User;
}

export default function RoleManagement({ currentUser }: RoleManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Note: Backend typically assumes org_id from JWT req.user. We pass it as a query arg anyway based on the API.
  const orgId = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;

  const { data: rolesResponse, isLoading: rolesLoading, refetch } = useGetRolesQuery({ orgId, includeSystem: true });
  const { data: permissionsResponse, isLoading: permsLoading } = useGetAvailablePermissionsQuery(orgId);
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRole({
        name: roleName,
        description: roleDescription,
        org_id: orgId,
        permissionIds: selectedPermissions
      }).unwrap();
      setIsModalOpen(false);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);
      refetch();
    } catch (err: any) {
        console.error(err);
        alert(err.data?.message || 'Failed to create role');
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const roles = rolesResponse?.data || [];
  const permissions = permissionsResponse?.data || [];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
           <h2 className="text-lg font-semibold text-gray-800">Role Management</h2>
           <p className="text-sm text-gray-500">Design custom structural roles strictly using the permissions allocated to your organization.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} />
          Create Custom Role
        </button>
      </div>

      <div className="p-6 overflow-x-auto min-h-[300px]">
        {rolesLoading ? (
          <div className="text-center py-10 text-gray-500">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No roles defined. Create your first custom role above.</div>
        ) : (
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-y">
               <tr>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600">Role Name</th>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600">Description</th>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600">Scope</th>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600">Permissions</th>
               </tr>
             </thead>
             <tbody className="divide-y text-sm text-gray-800">
               {roles.map((role: any) => (
                 <tr key={role.id}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <Shield size={16} className={`flex-shrink-0 ${role.org_id ? "text-emerald-500" : "text-gray-400"}`} />
                        {role.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{role.description || '-'}</td>
                    <td className="px-4 py-3">
                        {role.org_id ? <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold tracking-wide">Custom</span> : <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold tracking-wide">System</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{role.Permissions?.length || 0} assigned</td>
                 </tr>
               ))}
             </tbody>
          </table>
        )}
      </div>

      {/* Role Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b bg-gray-50">
                 <h2 className="text-xl font-bold text-gray-800">Design Custom Role</h2>
                 <p className="text-sm text-gray-500 mt-1">Combine allocated permissions to form your own branch-specific or structure-specific administrative roles.</p>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                 <form id="roleForm" onSubmit={handleCreate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                          <input required type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 bg-gray-50 border" placeholder="e.g. Zone Manager" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                          <input type="text" value={roleDescription} onChange={e => setRoleDescription(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 bg-gray-50 border" placeholder="Briefly describe responsibility" />
                      </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end border-b pb-2 mb-4 mt-6">
                           <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Available Permissions</h3>
                           <span className="text-xs text-gray-500">{selectedPermissions.length} selected</span>
                        </div>
                        {permsLoading ? <div className="py-6 text-center text-sm text-gray-500 animate-pulse">Loading permissions gateway...</div> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {permissions.map((p: any) => (
                                    <label key={p.id} className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${!p.has_access ? 'bg-gray-100 border-gray-200 opacity-60' : selectedPermissions.includes(p.id) ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300' : 'cursor-pointer hover:bg-gray-50 border-gray-300'}`}>
                                        <input 
                                           title={!p.has_access ? "Contact Super Admin to unlock this capability" : "Assign Permission"}
                                           type="checkbox" 
                                           disabled={!p.has_access}
                                           checked={selectedPermissions.includes(p.id)}
                                           onChange={() => togglePermission(p.id)}
                                           className={`mt-1 flex-shrink-0 h-4 w-4 rounded ${!p.has_access ? 'text-gray-300' : 'text-emerald-600 focus:ring-emerald-500'}`}
                                        />
                                        <div className="flex-1">
                                           <div className="text-sm font-medium text-gray-900 flex justify-between items-center pr-2">
                                              {p.name}
                                              {!p.has_access && <Lock size={14} className="text-gray-500" title="Locked by Admin" />}
                                           </div>
                                           <p className="text-xs text-gray-500 mt-1 leading-snug">{p.description || "System permission."}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                 </form>
              </div>
              <div className="px-6 py-4 border-t bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                 <button type="submit" form="roleForm" disabled={isCreating || selectedPermissions.length === 0 || !roleName} className="px-5 py-2.5 font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                    {isCreating ? 'Saving...' : 'Construct Role'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useGetAvailablePermissionsQuery, useAllocatePermissionMutation, useGetUnitTreeQuery } from '../../store/apiSlice/practikalApi';
import { ShieldAlert, ShieldCheck, GitFork, Lock, Activity, ChevronRight, ChevronDown } from 'lucide-react';
import { User } from '../../types';

export default function PermissionManager({ currentUser }: { currentUser: User }) {
  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.user_type === 'SUPERADMIN';
  const orgId = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;

  const { data: permsRes, isLoading: loadingPerms, refetch: refetchPerms } = useGetAvailablePermissionsQuery(orgId);
  const { data: treeRes, isLoading: loadingTree } = useGetUnitTreeQuery(orgId);
  const [allocatePerm, { isLoading: isAllocating }] = useAllocatePermissionMutation();

  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Backend endpoint handles SuperAdmin "PUSH" vs allocation if it's missing, but here we focus on the allocation matrix.

  if (loadingPerms || loadingTree) return <div className="p-6 text-gray-500 animate-pulse">Loading secure permission matrix...</div>;

  const permissions = permsRes?.data || [];
  const rootUnits = treeRes?.data || [];

  const selectedPerm = permissions.find((p: any) => p.id === selectedPermissionId);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAllocation = async (permissionId: string, unitId: string | null = null, effect: 'GRANT' | 'DENY') => {
    try {
      await allocatePerm({
         permissionId,
         target_type: unitId ? 'UNIT' : 'ORGANIZATION',
         target_id: unitId || orgId, // if unitId is null, allocate to org
         effect
      }).unwrap();
      refetchPerms(); // Refetch to recalculate has_access logic
      alert(`Successfully ${effect}ed permission.`);
    } catch (err: any) {
      alert(err.data?.message || 'Failed to allocate permission');
    }
  };

  const renderTree = (nodes: any[]) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <ul className="pl-6 space-y-2 mt-2 border-l-2 border-gray-100 ml-2">
        {nodes.map(node => {
           const isExpanded = expandedNodes.has(node.id);
           const hasChildren = node.children && node.children.length > 0;
           
           return (
             <li key={node.id} className="relative">
               <div className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-lg hover:border-emerald-300">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleNode(node.id)} className="p-1 hover:bg-gray-100 rounded text-gray-500 flex-shrink-0">
                      {hasChildren ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : <span className="w-[18px] inline-block" />}
                    </button>
                    <GitFork size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-800 text-sm">{node.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={() => handleAllocation(selectedPermissionId!, node.id, 'GRANT')}
                        disabled={isAllocating}
                        className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                     >GRANT</button>
                     <button 
                        onClick={() => handleAllocation(selectedPermissionId!, node.id, 'DENY')}
                        disabled={isAllocating}
                        className="text-xs font-semibold px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                     >DENY</button>
                  </div>
               </div>
               {isExpanded && renderTree(node.children)}
             </li>
           );
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column: Permission List */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[700px]">
        <div className="p-5 border-b">
           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShieldAlert className="text-amber-500" />
              Permission Engine
           </h2>
           <p className="text-xs text-gray-500 mt-1">Select a capability to manage its cascading rules.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
           {permissions.length === 0 && <p className="text-sm text-gray-500 text-center mt-10">No permissions found.</p>}
           {permissions.map((p: any) => (
              <div 
                 key={p.id} 
                 onClick={() => setSelectedPermissionId(p.id)}
                 className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedPermissionId === p.id ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300'}`}
              >
                 <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 text-sm">{p.name}</h3>
                    {!p.has_access && <Lock size={14} className="text-rose-400" />}
                    {p.has_access && <ShieldCheck size={14} className="text-emerald-500" />}
                 </div>
                 <p className="text-xs text-gray-500 line-clamp-2">{p.description || 'System core capability'}</p>
              </div>
           ))}
        </div>
      </div>

      {/* Right Column: Allocation Matrix */}
      <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 h-[700px] flex flex-col">
        {selectedPerm ? (
          <>
            <div className="p-6 border-b bg-gray-50 rounded-t-xl">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                     <Activity className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedPerm.name}</h2>
                    <p className="text-sm text-gray-600">{selectedPerm.description || 'Manage access rules for this capability.'}</p>
                  </div>
               </div>
               
               {isSuperAdmin && (
                 <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-amber-800 font-medium font-medium">SUPER ADMIN OVERRIDE</span>
                    <button 
                       onClick={() => handleAllocation(selectedPerm.id, null, 'GRANT')}
                       className="px-4 py-1.5 bg-amber-500 text-white text-sm font-bold rounded-md hover:bg-amber-600 shadow-sm"
                    >Force Grant Globally</button>
                 </div>
               )}
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Branch Cascading Rules</h3>
               {rootUnits.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                     No physical branches built yet. Go to Structural Hierarchy to build your company.
                  </div>
               ) : (
                  renderTree(rootUnits)
               )}
            </div>
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <ShieldAlert size={64} className="text-gray-200 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-400">No Target Selected</h2>
              <p className="text-gray-400 mt-2 max-w-sm">Select a permission from the engine list on the left to map its cascading branch rules.</p>
           </div>
        )}
      </div>
    </div>
  );
}

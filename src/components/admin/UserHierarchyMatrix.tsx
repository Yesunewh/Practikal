import React, { useMemo } from 'react';
import { User } from '../../types';
import { 
  Building2, 
  Users, 
  ChevronRight, 
  User as UserIcon,
  Search,
  Filter
} from 'lucide-react';

interface MatrixProps {
  users: User[];
  unitTree: any[];
  departments: { id: string; name: string }[];
  onManageUser?: (user: User) => void;
}

export default function UserHierarchyMatrix({ users, unitTree, departments, onManageUser }: MatrixProps) {
  // Flatten tree for vertical axis
  const flattenHierarchy = (nodes: any[], level = 0): { id: string; name: string; level: number }[] => {
    let result: any[] = [];
    nodes.forEach(node => {
      result.push({ id: node.id, name: node.name, level });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenHierarchy(node.children, level + 1));
      }
    });
    return result;
  };

  const branches = useMemo(() => flattenHierarchy(unitTree), [unitTree]);

  // Group users by branch and department
  const matrix = useMemo(() => {
    const data: Record<string, Record<string, User[]>> = {};
    
    branches.forEach(b => {
      data[b.id] = {};
      departments.forEach(d => {
        data[b.id][d.id] = [];
      });
    });

    users.forEach(u => {
      if (u.unitId && data[u.unitId] && u.deptId && data[u.unitId][u.deptId]) {
        data[u.unitId][u.deptId].push(u);
      }
    });

    return data;
  }, [users, branches, departments]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-neutral-50 border-b border-r border-neutral-200 p-4 text-left w-64 min-w-[256px]">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Building2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Branch Hierarchy</span>
                </div>
              </th>
              {departments.map(dept => (
                <th key={dept.id} className="bg-neutral-50 border-b border-neutral-200 p-4 text-center min-w-[200px]">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    {dept.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {branches.map(branch => (
              <tr key={branch.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="sticky left-0 z-10 bg-white border-r border-neutral-200 p-4">
                  <div 
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${branch.level * 1.5}rem` }}
                  >
                    {branch.level > 0 && <ChevronRight size={14} className="text-neutral-300" />}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-neutral-900 leading-none">
                        {branch.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 mt-1 uppercase">
                        Level {branch.level + 1}
                      </span>
                    </div>
                  </div>
                </td>
                {departments.map(dept => {
                  const cellUsers = matrix[branch.id]?.[dept.id] || [];
                  return (
                    <td key={dept.id} className="p-2 border-r border-neutral-100 last:border-r-0">
                      <div className="min-h-[60px] flex flex-wrap gap-2 justify-center content-center">
                        {cellUsers.length > 0 ? (
                          cellUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => onManageUser?.(user)}
                              className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title={`${user.firstName} ${user.lastName}`}
                            >
                              <UserIcon size={14} />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30">
                                <div className="bg-neutral-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="w-2 h-2 bg-neutral-900 rotate-45 mx-auto -mt-1" />
                              </div>
                            </button>
                          ))
                        ) : (
                          <span className="text-[10px] text-neutral-300 italic">Empty</span>
                        )}
                      </div>
                      {cellUsers.length > 0 && (
                        <div className="mt-1 text-center">
                          <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                            {cellUsers.length} Users
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

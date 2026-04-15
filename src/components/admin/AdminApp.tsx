import { User } from '../../types';
import AdminDashboard from './AdminDashboard';

interface AdminAppProps {
  currentUser: User;
  onBack?: () => void;
}

export default function AdminApp({ currentUser, onBack }: AdminAppProps) {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
  
  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard currentUser={currentUser} onBack={onBack} />;
}

import { User } from '../../types';
import AdminDashboard from './AdminDashboard';
import { useI18n } from '../../i18n/I18nContext';
import { canAccessAdminPortal } from '../../utils/authIdentity';

interface AdminAppProps {
  currentUser: User;
  onBack?: () => void;
}

export default function AdminApp({ currentUser, onBack }: AdminAppProps) {
  const { messages } = useI18n();
  const ad = messages.admin;
  const isAdmin = canAccessAdminPortal(currentUser);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">{ad.accessDeniedTitle}</h2>
          <p className="text-gray-600">{ad.accessDeniedBody}</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard currentUser={currentUser} onBack={onBack} />;
}

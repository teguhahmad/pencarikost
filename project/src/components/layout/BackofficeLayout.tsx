import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Building2, Bell, LayoutDashboard, Settings, LogOut, CreditCard, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BackofficeLayoutProps {
  children: React.ReactNode;
}

const BackofficeLayout: React.FC<BackofficeLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/backoffice' },
    { id: 'users', label: 'Users', icon: <Users size={20} />, path: '/backoffice/users' },
    { id: 'properties', label: 'Properties', icon: <Building2 size={20} />, path: '/backoffice/properties' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, path: '/backoffice/notifications' },
    { id: 'subscription-plans', label: 'Subscription Plans', icon: <CreditCard size={20} />, path: '/backoffice/subscription-plans' },
    { id: 'role-permissions', label: 'Role & Permissions', icon: <Shield size={20} />, path: '/backoffice/role-permissions' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/backoffice/settings' }
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-full bg-white border-r border-gray-200">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Kostopia Admin</h1>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg"
          >
            <LogOut size={20} className="mr-3" />
            Keluar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  );
};

export default BackofficeLayout;
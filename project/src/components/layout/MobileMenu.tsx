import React from 'react';
import { X, Home, Users, DoorClosed, CreditCard, ClipboardList, BarChart, Settings, Bell, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface MobileMenuProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ activeItem, onItemClick, onClose }) => {
  const navigate = useNavigate();
  const menuItems = [
    { id: 'dashboard', label: 'Beranda', icon: <Home size={20} /> },
    { id: 'tenants', label: 'Penyewa', icon: <Users size={20} /> },
    { id: 'rooms', label: 'Kamar', icon: <DoorClosed size={20} /> },
    { id: 'payments', label: 'Pembayaran', icon: <CreditCard size={20} /> },
    { id: 'maintenance', label: 'Pemeliharaan', icon: <ClipboardList size={20} /> },
    { id: 'reports', label: 'Laporan', icon: <BarChart size={20} /> },
    { id: 'notifications', label: 'Notifikasi', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings size={20} /> }
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
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Kostopia</h1>
          <button onClick={onClose} className="text-gray-500">
            <X size={24} />
          </button>
        </div>
        
        <div className="py-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-sm ${
                    activeItem === item.id
                      ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="absolute bottom-0 w-full border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <span className="mr-3"><LogOut size={20} /></span>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
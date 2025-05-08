import React from 'react';
import { Home, Users, DoorClosed, CreditCard, Menu } from 'lucide-react';

interface MobileNavProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  onMenuClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeItem, onItemClick, onMenuClick }) => {
  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: <Home size={20} /> },
    { id: 'tenants', label: 'Penyewa', icon: <Users size={20} /> },
    { id: 'rooms', label: 'Kamar', icon: <DoorClosed size={20} /> },
    { id: 'payments', label: 'Pembayaran', icon: <CreditCard size={20} /> }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="grid grid-cols-5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`flex flex-col items-center justify-center py-2 ${
              activeItem === item.id ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center py-2 text-gray-600"
        >
          <Menu size={20} />
          <span className="text-xs mt-1">Lainnya</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNav;
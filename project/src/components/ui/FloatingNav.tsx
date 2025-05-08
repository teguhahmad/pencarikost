import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, Bell, User } from 'lucide-react';

const FloatingNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-md rounded-full shadow-lg px-6 py-4 flex items-center gap-8 border border-gray-200">
        <button
          onClick={() => navigate('/marketplace')}
          className={`flex flex-col items-center transition-colors ${
            isActive('/marketplace') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </button>

        <button
          onClick={() => navigate('/marketplace/saved')}
          className={`flex flex-col items-center transition-colors ${
            isActive('/marketplace/saved') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Heart size={24} />
          <span className="text-xs mt-1">Favorit</span>
        </button>

        <button
          onClick={() => navigate('/marketplace/chat')}
          className={`flex flex-col items-center transition-colors ${
            isActive('/marketplace/chat') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <MessageCircle size={24} />
          <span className="text-xs mt-1">Chat</span>
        </button>

        <button
          onClick={() => navigate('/marketplace/notifications')}
          className={`flex flex-col items-center transition-colors ${
            isActive('/marketplace/notifications') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Bell size={24} />
          <span className="text-xs mt-1">Notifikasi</span>
        </button>

        <button
          onClick={() => navigate('/marketplace/profile')}
          className={`flex flex-col items-center transition-colors ${
            isActive('/marketplace/profile') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Profil</span>
        </button>
      </div>
    </div>
  );
};

export default FloatingNav;
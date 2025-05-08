import React from 'react';
import { Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MarketplaceButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/marketplace')}
      className="fixed bottom-24 right-20 z-50 p-3 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all transform hover:scale-110"
      title="Browse Marketplace"
    >
      <Store className="h-6 w-6" />
    </button>
  );
};

export default MarketplaceButton;
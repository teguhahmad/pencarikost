import React from 'react';
import { useProperty } from '../../contexts/PropertyContext';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PropertySelector: React.FC = () => {
  const { properties, selectedProperty, setSelectedProperty, isLoading, error } = useProperty();
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      if (location.pathname === '/properties') {
        navigate('/dashboard');
      }
    }
    setIsOpen(false);
  };

  const handleAddProperty = () => {
    navigate('/properties');
    setIsOpen(false);
  };

  // Only hide the selector on the properties page
  if (location.pathname === '/properties') {
    return null;
  }

  if (!selectedProperty && location.pathname !== '/properties') {
    navigate('/properties');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-gray-600">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading properties...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-red-600">
        <span>Error loading properties</span>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <button
        onClick={handleAddProperty}
        className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <Building2 size={20} className="mr-2" />
        Tambah Properti
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
      >
        <Building2 size={20} />
        <span>{selectedProperty?.name || 'Pilih Properti'}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg z-50">
          <div className="py-1">
            {properties.map(property => (
              <button
                key={property.id}
                onClick={() => handlePropertyChange(property.id)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  selectedProperty?.id === property.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {property.name}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1">
              <button
                onClick={handleAddProperty}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
              >
                + Tambah Properti Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertySelector;
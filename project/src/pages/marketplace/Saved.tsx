import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types';
import { supabase } from '../../lib/supabase';
import { Building2, MapPin, Heart, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import FloatingNav from '../../components/ui/FloatingNav';

const SavedProperties: React.FC = () => {
  const navigate = useNavigate();
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedProperties();
  }, []);

  const loadSavedProperties = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      const { data: savedData, error: savedError } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', user.id);

      if (savedError) throw savedError;

      if (savedData && savedData.length > 0) {
        const propertyIds = savedData.map(item => item.property_id);
        
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds)
          .eq('marketplace_enabled', true)
          .eq('marketplace_status', 'published');

        if (propertiesError) throw propertiesError;
        setSavedProperties(properties || []);
      }
    } catch (err) {
      console.error('Error loading saved properties:', err);
      setError('Failed to load saved properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyClick = (property: Property) => {
    navigate(`/marketplace/property/${property.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Properti Tersimpan</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {savedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handlePropertyClick(property)}
              >
                <div className="relative h-48">
                  {property.photos && property.photos.length > 0 ? (
                    <img
                      src={property.photos[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building2 size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Heart className="h-6 w-6 text-red-500 fill-current" />
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin size={16} className="mr-1" />
                    <p className="text-sm">{property.address}, {property.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada properti tersimpan</h3>
            <p className="text-gray-500 mb-6">Simpan properti yang Anda sukai untuk melihatnya nanti</p>
            <Button onClick={() => navigate('/marketplace')}>
              Cari Properti
            </Button>
          </div>
        )}
      </div>

      <FloatingNav />
    </div>
  );
};

export default SavedProperties;
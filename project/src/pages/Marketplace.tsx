import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { supabase } from '../lib/supabase';
import FloatingNav from '../components/ui/FloatingNav';
import { Search, Loader2, Filter, MapPin, Users, Scale as Male, Users2, Home, Heart } from 'lucide-react';
import Button from '../components/ui/Button';
import PropertyCards from '../components/marketplace/PropertyCards';

interface RoomWithProperty extends RoomType {
  property: Property;
  isSaved?: boolean;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomWithProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);

      // First get all published properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) throw propertiesError;

      // Get unique cities
      const uniqueCities = [...new Set(properties?.map(p => p.city) || [])];
      setCities(uniqueCities);

      // Then get room types for each property
      const allRooms: RoomWithProperty[] = [];
      for (const property of properties || []) {
        const { data: roomTypes, error: roomTypesError } = await supabase
          .from('room_types')
          .select('*')
          .eq('property_id', property.id);

        if (roomTypesError) throw roomTypesError;

        // Combine room types with property information
        const roomsWithProperty = (roomTypes || []).map(room => ({
          ...room,
          property,
          isSaved: false
        }));
        allRooms.push(...roomsWithProperty);
      }

      // Check which rooms are saved by the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: savedProperties } = await supabase
          .from('saved_properties')
          .select('property_id')
          .eq('user_id', user.id);

        if (savedProperties) {
          const savedPropertyIds = new Set(savedProperties.map(sp => sp.property_id));
          allRooms.forEach(room => {
            room.isSaved = savedPropertyIds.has(room.property.id);
          });
        }
      }

      setRooms(allRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToggle = (propertyId: string, roomId: string) => {
    setRooms(rooms.map(r => 
      r.id === roomId ? { ...r, isSaved: !r.isSaved } : r
    ));
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.property.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = selectedCity === 'all' || room.property.city === selectedCity;
    return matchesSearch && matchesCity;
  });

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
          <div className="py-6 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari kamar kos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            {/* City Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              <Button
                size="sm"
                variant={selectedCity === 'all' ? 'primary' : 'outline'}
                onClick={() => setSelectedCity('all')}
              >
                Semua Kota
              </Button>
              {cities.map(city => (
                <Button
                  key={city}
                  size="sm"
                  variant={selectedCity === city ? 'primary' : 'outline'}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          <PropertyCards rooms={filteredRooms} onSaveToggle={handleSaveToggle} />
        ) : (
          <div className="text-center py-12">
            <Home size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery
                ? 'Tidak ada kamar yang sesuai dengan pencarian Anda'
                : 'Belum ada kamar yang tersedia'}
            </h3>
          </div>
        )}
      </div>

      <FloatingNav />
    </div>
  );
}
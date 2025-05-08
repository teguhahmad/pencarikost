import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { supabase } from '../lib/supabase';
import FloatingNav from '../components/ui/FloatingNav';
import { Search, Loader2, Filter, MapPin, Users, Scale as Male, Users2, Home, Heart } from 'lucide-react';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';

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
  const [savingRoom, setSavingRoom] = useState<string | null>(null);

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

  const handleSaveRoom = async (e: React.MouseEvent, propertyId: string, roomId: string) => {
    e.stopPropagation();
    try {
      setSavingRoom(roomId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      if (room.isSaved) {
        // Remove from saved properties
        await supabase
          .from('saved_properties')
          .delete()
          .eq('property_id', propertyId)
          .eq('user_id', user.id);
      } else {
        // Add to saved properties
        await supabase
          .from('saved_properties')
          .insert([{
            property_id: propertyId,
            user_id: user.id
          }]);
      }

      // Update local state
      setRooms(rooms.map(r => 
        r.id === roomId ? { ...r, isSaved: !r.isSaved } : r
      ));
    } catch (err) {
      console.error('Error saving room:', err);
    } finally {
      setSavingRoom(null);
    }
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

  const getRoomTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      standard: 'bg-blue-100 text-blue-800',
      deluxe: 'bg-purple-100 text-purple-800',
      suite: 'bg-indigo-100 text-indigo-800',
      single: 'bg-green-100 text-green-800',
      double: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <Male size={16} className="text-blue-500" />;
      case 'female':
        return <Male size={16} className="text-pink-500" />;
      default:
        return <Users2 size={16} className="text-purple-500" />;
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"> {/* max-w-7xl → max-w-5xl */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-md"
                onClick={() => navigate(`/marketplace/property/${room.property.id}`)}
              >
                <div className="relative aspect-[16/9]"> {/* Tambahkan aspect ratio 16:9 */}
                  {room.photos && room.photos.length > 0 ? (
                    <img
                      src={room.photos[0]}
                      alt={`${room.name} - ${room.property.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Home size={48} className="text-gray-300" />
                    </div>
                  )}
                  {/* Save Button */}
                  <button
                    onClick={(e) => handleSaveRoom(e, room.property.id, room.id)}
                    disabled={savingRoom === room.id}
                    className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all ${
                      room.isSaved 
                        ? 'bg-red-500/90 text-white' 
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    } shadow-lg`}
                  >
                    <Heart 
                      className={`${room.isSaved ? 'fill-current' : ''} ${
                        savingRoom === room.id ? 'animate-pulse' : ''
                      }`} 
                      size={20} 
                    />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {/* Property Name and Location */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{room.property.name}</h3>
                    <div className="flex items-center mt-1 text-gray-500">
                      <MapPin size={14} className="mr-1 flex-shrink-0" />
                      <p className="text-sm truncate">{room.property.address}, {room.property.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoomTypeColor(room.name)}`}>
                      <Home size={12} />
                      {room.name}
                    </span>
                    <div className="flex items-center text-gray-600">
                      <Users size={16} className="mr-1" />
                      <span>Maks. {room.max_occupancy} orang</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      {getGenderIcon(room.renter_gender)}
                      <span className="ml-1">
                        {room.renter_gender === 'male' ? 'Putra' : 
                         room.renter_gender === 'female' ? 'Putri' : 'Campur'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-baseline">
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(room.price)}
                      </p>
                      <span className="text-sm text-gray-500 ml-1">/bulan</span>
                    </div>
                    {(room.enable_daily_price || room.enable_weekly_price || room.enable_yearly_price) && (
                      <p className="text-sm text-gray-500 mt-1">
                        Tersedia sewa {[
                          room.enable_daily_price && 'harian',
                          room.enable_weekly_price && 'mingguan',
                          room.enable_yearly_price && 'tahunan'
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
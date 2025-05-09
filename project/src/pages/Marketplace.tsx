import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { supabase } from '../lib/supabase';
import FloatingNav from '../components/ui/FloatingNav';
import { Search, Filter, MapPin, Users, Scale as Male, Users2, Home, Heart, ChevronDown, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000000],
    occupancy: 'all',
    gender: 'all',
    type: 'all'
  });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'newest'>('newest');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);

      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) throw propertiesError;

      const uniqueCities = [...new Set(properties?.map(p => p.city) || [])];
      setCities(uniqueCities);

      const allRooms: RoomWithProperty[] = [];
      for (const property of properties || []) {
        const { data: roomTypes, error: roomTypesError } = await supabase
          .from('room_types')
          .select('*')
          .eq('property_id', property.id);

        if (roomTypesError) throw roomTypesError;

        const roomsWithProperty = (roomTypes || []).map(room => ({
          ...room,
          property,
          isSaved: false
        }));
        allRooms.push(...roomsWithProperty);
      }

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
    const matchesPrice = room.price >= filters.priceRange[0] && room.price <= filters.priceRange[1];
    const matchesOccupancy = filters.occupancy === 'all' || room.max_occupancy === parseInt(filters.occupancy);
    const matchesGender = filters.gender === 'all' || room.renter_gender === filters.gender;
    const matchesType = filters.type === 'all' || room.name.toLowerCase() === filters.type.toLowerCase();

    return matchesSearch && matchesCity && matchesPrice && matchesOccupancy && matchesGender && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Marketplace</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari kos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F2F2F7] rounded-xl text-gray-900 focus:outline-none"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
            >
              <Filter size={16} />
              Filter
            </button>
            <button
              className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
              onClick={() => {
                const menu = document.createElement('select');
                menu.className = 'absolute top-0 left-0 opacity-0';
                menu.onchange = (e) => setSortBy(e.target.value as any);
                menu.innerHTML = `
                  <option value="newest">Terbaru</option>
                  <option value="price-asc">Harga Terendah</option>
                  <option value="price-desc">Harga Tertinggi</option>
                `;
                document.body.appendChild(menu);
                menu.click();
                menu.remove();
              }}
            >
              Urutkan
              <ChevronDown size={16} />
            </button>
            {selectedCity !== 'all' && (
              <button
                onClick={() => setSelectedCity('all')}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
              >
                {selectedCity}
                <span className="ml-1">&times;</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
                onClick={() => navigate(`/marketplace/property/${room.property.id}`)}
              >
                {/* Room Image */}
                <div className="relative aspect-[16/9]">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveToggle(room.property.id, room.id);
                    }}
                    className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all ${
                      room.isSaved 
                        ? 'bg-red-500/90 text-white' 
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    } shadow-lg`}
                  >
                    <Heart className={room.isSaved ? 'fill-current' : ''} size={20} />
                  </button>
                </div>

                {/* Room Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{room.property.name}</h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin size={16} className="mr-1" />
                    <p className="text-sm">{room.property.address}, {room.property.city}</p>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center text-gray-600">
                      <Users size={16} className="mr-1" />
                      <span className="text-sm">Maks. {room.max_occupancy} orang</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      {room.renter_gender === 'male' ? (
                        <Male size={16} className="text-blue-500 mr-1" />
                      ) : room.renter_gender === 'female' ? (
                        <Users2 size={16} className="text-pink-500 mr-1" />
                      ) : (
                        <Users2 size={16} className="text-purple-500 mr-1" />
                      )}
                      <span className="text-sm">
                        {room.renter_gender === 'male' ? 'Putra' : 
                         room.renter_gender === 'female' ? 'Putri' : 'Campur'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
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

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Filter</h2>
              
              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Rentang Harga</h3>
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: [0, parseInt(e.target.value)]
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Rp 0</span>
                  <span>{formatCurrency(filters.priceRange[1])}</span>
                </div>
              </div>

              {/* Occupancy */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Kapasitas</h3>
                <div className="flex flex-wrap gap-2">
                  {['all', '1', '2', '3', '4'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setFilters({ ...filters, occupancy: value })}
                      className={`px-4 py-2 rounded-full text-sm ${
                        filters.occupancy === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {value === 'all' ? 'Semua' : `${value} Orang`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Khusus</h3>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Semua' },
                    { value: 'male', label: 'Putra' },
                    { value: 'female', label: 'Putri' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilters({ ...filters, gender: value })}
                      className={`px-4 py-2 rounded-full text-sm ${
                        filters.gender === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: [0, 10000000],
                      occupancy: 'all',
                      gender: 'all',
                      type: 'all'
                    });
                    setShowFilters(false);
                  }}
                  className="flex-1 py-3 text-gray-700 font-medium bg-gray-100 rounded-xl"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 text-white font-medium bg-blue-600 rounded-xl"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FloatingNav />
    </div>
  );
}

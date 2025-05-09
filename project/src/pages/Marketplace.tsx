import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { supabase } from '../lib/supabase';
import FloatingNav from '../components/ui/FloatingNav';
import { Search, Filter, MapPin, Map, ArrowUpDown } from 'lucide-react';
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
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: [0, 10000000],
    occupancy: 'all',
    gender: 'all',
    type: 'all'
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-asc' | 'price-desc'>('newest');
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
      case 'newest':
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      case 'oldest':
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'newest':
        return 'Terbaru';
      case 'oldest':
        return 'Terlama';
      case 'price-asc':
        return 'Harga Terendah';
      case 'price-desc':
        return 'Harga Tertinggi';
      default:
        return 'Urutkan';
    }
  };

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
            {/* Location Filter */}
            <button
              onClick={() => setShowLocationFilter(true)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
            >
              <Map size={16} />
              {selectedCity === 'all' ? 'Semua Lokasi' : selectedCity}
            </button>

            {/* Sort Button */}
            <button
              onClick={() => setShowSortModal(true)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
            >
              <ArrowUpDown size={16} />
              {getSortLabel(sortBy)}
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
            >
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Sort Modal */}
      {showSortModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Urutkan</h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSortBy('newest');
                    setShowSortModal(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left ${
                    sortBy === 'newest'
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Terbaru
                </button>
                <button
                  onClick={() => {
                    setSortBy('oldest');
                    setShowSortModal(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left ${
                    sortBy === 'oldest'
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Terlama
                </button>
                <button
                  onClick={() => {
                    setSortBy('price-asc');
                    setShowSortModal(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left ${
                    sortBy === 'price-asc'
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Harga Terendah
                </button>
                <button
                  onClick={() => {
                    setSortBy('price-desc');
                    setShowSortModal(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left ${
                    sortBy === 'price-desc'
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Harga Tertinggi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Filter Modal */}
      {showLocationFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Pilih Lokasi</h2>
              
              {/* Location Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Cari lokasi..."
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-gray-900 focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCity('all');
                    setShowLocationFilter(false);
                    setLocationSearchQuery('');
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left ${
                    selectedCity === 'all'
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Semua Lokasi
                </button>
                {filteredCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setShowLocationFilter(false);
                      setLocationSearchQuery('');
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-left ${
                      selectedCity === city
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <PropertyCards 
            rooms={filteredRooms}
            onSaveToggle={handleSaveToggle}
          />
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
                  <span>Rp {filters.priceRange[1].toLocaleString()}</span>
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

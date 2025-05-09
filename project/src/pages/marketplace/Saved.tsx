import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Building2, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import FloatingNav from '../../components/ui/FloatingNav';
import PropertyCards from '../../components/marketplace/PropertyCards';

interface SavedRoom {
  id: string;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    email: string;
    phone: string;
  };
  isSaved: boolean;
  name: string;
  price: number;
  daily_price?: number;
  weekly_price?: number;
  yearly_price?: number;
  enable_daily_price?: boolean;
  enable_weekly_price?: boolean;
  enable_yearly_price?: boolean;
  photos?: string[];
  max_occupancy: number;
  renter_gender: string;
}

const SavedProperties: React.FC = () => {
  const navigate = useNavigate();
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedRooms();
  }, []);

  const loadSavedRooms = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      // Get saved room IDs for the user
      const { data: savedRooms, error: savedError } = await supabase
        .from('saved_rooms')
        .select('room_type_id')
        .eq('user_id', user.id);

      if (savedError) throw savedError;

      if (!savedRooms || savedRooms.length === 0) {
        setSavedRooms([]);
        return;
      }

      const roomTypeIds = savedRooms.map(item => item.room_type_id);
      
      // Get room types and their properties
      const { data: roomTypes, error: roomsError } = await supabase
        .from('room_types')
        .select(`
          id,
          name,
          price,
          daily_price,
          weekly_price,
          yearly_price,
          enable_daily_price,
          enable_weekly_price,
          enable_yearly_price,
          photos,
          max_occupancy,
          renter_gender,
          properties (
            id,
            name,
            address,
            city,
            email,
            phone
          )
        `)
        .in('id', roomTypeIds);

      if (roomsError) throw roomsError;

      // Transform the data
      const rooms: SavedRoom[] = roomTypes?.map(roomType => ({
        id: roomType.id,
        property: {
          id: roomType.properties.id,
          name: roomType.properties.name,
          address: roomType.properties.address,
          city: roomType.properties.city,
          email: roomType.properties.email,
          phone: roomType.properties.phone,
        },
        isSaved: true,
        name: roomType.name,
        price: roomType.price,
        daily_price: roomType.daily_price,
        weekly_price: roomType.weekly_price,
        yearly_price: roomType.yearly_price,
        enable_daily_price: roomType.enable_daily_price,
        enable_weekly_price: roomType.enable_weekly_price,
        enable_yearly_price: roomType.enable_yearly_price,
        photos: roomType.photos,
        max_occupancy: roomType.max_occupancy,
        renter_gender: roomType.renter_gender,
      })) || [];

      setSavedRooms(rooms);
    } catch (err) {
      console.error('Error loading saved rooms:', err);
      setError('Failed to load saved rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToggle = async (propertyId: string, roomId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('saved_rooms')
        .delete()
        .eq('room_type_id', roomId)
        .eq('user_id', user.id);

      setSavedRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Favorit</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4">
            {error}
          </div>
        )}

        {savedRooms.length > 0 ? (
          <PropertyCards
            rooms={savedRooms}
            onSaveToggle={handleSaveToggle}
          />
        ) : (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kamar tersimpan</h3>
            <p className="text-gray-500 mb-6">Simpan kamar yang Anda sukai untuk melihatnya nanti</p>
            <Button onClick={() => navigate('/marketplace')}>
              Cari Kamar
            </Button>
          </div>
        )}
      </div>

      <FloatingNav />
    </div>
  );
};

export default SavedProperties;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  MapPin,
  Heart,
  Users,
  Users2,
  Home
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RoomType {
  id: string;
  property: Property;
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

interface PropertyCardsProps {
  rooms: RoomType[];
  onSaveToggle?: (propertyId: string, roomId: string) => void;
}

const PropertyCards: React.FC<PropertyCardsProps> = ({ rooms, onSaveToggle }) => {
  const navigate = useNavigate();
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [savingRoom, setSavingRoom] = useState<string | null>(null);

  // Ambil status saved room saat komponen di-mount
  useEffect(() => {
    const checkSavedRooms = async () => {
      if (!rooms.length) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const roomIds = rooms.map(room => room.id);
      const { data, error } = await supabase
        .from('saved_rooms')
        .select('room_type_id')
        .in('room_type_id', roomIds)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching saved rooms:', error);
        return;
      }

      const savedMap = Object.fromEntries(
        rooms.map((room) => [
          room.id,
          !!data?.some(saved => saved.room_type_id === room.id),
        ]),
      );

      setSavedStatus(savedMap);
    };

    checkSavedRooms();
  }, [rooms]);

  const handleSaveRoom = async (
    e: React.MouseEvent,
    propertyId: string,
    roomId: string
  ) => {
    e.stopPropagation();
    try {
      setSavingRoom(roomId);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      const isCurrentlySaved = savedStatus[roomId];

      if (isCurrentlySaved) {
        // Hapus dari tabel saved_rooms
        await supabase
          .from('saved_rooms')
          .delete()
          .eq('room_type_id', roomId)
          .eq('user_id', user.id);
      } else {
        // Tambahkan ke tabel saved_rooms jika belum ada
        const { data: existing } = await supabase
          .from('saved_rooms')
          .select('id')
          .eq('room_type_id', roomId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('saved_rooms')
            .insert([{ room_type_id: roomId, user_id: user.id }]);
        }
      }

      // Perbarui state lokal
      const newSavedStatus = {
        ...savedStatus,
        [roomId]: !isCurrentlySaved,
      };
      setSavedStatus(newSavedStatus);

      // Trigger callback ke parent component jika ada
      if (onSaveToggle) {
        onSaveToggle(propertyId, roomId);
      }
    } catch (err) {
      console.error('Error saving room:', err);
    } finally {
      setSavingRoom(null);
    }
  };

  const getRoomTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      standard: 'bg-blue-100 text-blue-800',
      deluxe: 'bg-purple-100 text-purple-800',
      suite: 'bg-indigo-100 text-indigo-800',
      single: 'bg-green-100 text-green-800',
      double: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <Users size={16} className="text-blue-500" />;
      case 'female':
        return <Users size={16} className="text-pink-500" />;
      default:
        return <Users2 size={16} className="text-purple-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-md"
          onClick={() => navigate(`/marketplace/property/${room.property.id}`)}
        >
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
              onClick={(e) => handleSaveRoom(e, room.property.id, room.id)}
              disabled={savingRoom === room.id}
              className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all ${
                savedStatus[room.id]
                  ? 'bg-red-500/90 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-white'
              } shadow-lg`}
            >
              <Heart
                className={`${
                  savedStatus[room.id] ? 'fill-current' : ''
                } ${savingRoom === room.id ? 'animate-pulse' : ''}`}
                size={20}
              />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {room.property.name}
              </h3>
              <div className="flex items-center mt-1 text-gray-500">
                <MapPin size={14} className="mr-1 flex-shrink-0" />
                <p className="text-sm truncate">
                  {room.property.address}, {room.property.city}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoomTypeColor(
                  room.name
                )}`}
              >
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
                  {room.renter_gender === 'male'
                    ? 'Putra'
                    : room.renter_gender === 'female'
                    ? 'Putri'
                    : 'Campur'}
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
              {(room.enable_daily_price ||
                room.enable_weekly_price ||
                room.enable_yearly_price) && (
                <p className="text-sm text-gray-500 mt-1">
                  Tersedia sewa{' '}
                  {[
                    room.enable_daily_price && 'harian',
                    room.enable_weekly_price && 'mingguan',
                    room.enable_yearly_price && 'tahunan',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyCards;

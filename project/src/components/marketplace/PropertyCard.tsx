import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Building2, MapPin, Heart, Users, Scale as Male, Scale as Female, Users2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PropertyCardProps {
  property: Property;
  lowestPrice: number;
  roomTypes: RoomType[];
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, lowestPrice, roomTypes }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, [property.id]);

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('property_id', property.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsSaved(data !== null);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      if (isSaved) {
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('property_id', property.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsSaved(false);
      } else {
        const { error } = await supabase
          .from('saved_properties')
          .insert([{
            property_id: property.id,
            user_id: user.id
          }]);

        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the first room type with photos
  const roomTypeWithPhotos = roomTypes.find(rt => rt.photos && rt.photos.length > 0);
  const roomPhotos = roomTypeWithPhotos?.photos || [];

  // Get alternative pricing options
  const hasAlternativePricing = roomTypes.some(rt => 
    rt.enable_daily_price || rt.enable_weekly_price || rt.enable_yearly_price
  );

  // Get max occupancy and gender preferences
  const maxOccupancy = Math.max(...roomTypes.map(rt => rt.max_occupancy || 1));
  const genderPreference = roomTypes[0]?.renter_gender || 'any';

  const getGenderIcon = () => {
    switch (genderPreference) {
      case 'male':
        return <Male size={16} className="text-blue-500" />;
      case 'female':
        return <Female size={16} className="text-pink-500" />;
      default:
        return <Users2 size={16} className="text-purple-500" />;
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg"
      onClick={() => navigate(`/marketplace/property/${property.id}`)}
    >
      <div className="relative">
        {/* Image */}
        <div className="relative h-48">
          {roomPhotos.length > 0 ? (
            <img
              src={roomPhotos[0]}
              alt={`${property.name} - Room`}
              className="w-full h-full object-cover"
            />
          ) : property.photos && property.photos.length > 0 ? (
            <img
              src={property.photos[0]}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Building2 size={48} className="text-gray-300" />
            </div>
          )}
          
          {/* Save Button */}
          <button
            onClick={handleSaveClick}
            disabled={isLoading}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all ${
              isSaved 
                ? 'bg-red-500/90 text-white' 
                : 'bg-white/90 text-gray-700 hover:bg-white'
            } shadow-lg`}
          >
            <Heart className={isSaved ? 'fill-current' : ''} size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and Location */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">{property.name}</h3>
            <div className="flex items-center mt-1 text-gray-500">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <p className="text-sm truncate">{property.address}, {property.city}</p>
            </div>
          </div>

          {/* Room Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Users size={16} className="mr-1" />
              <span>Maks. {maxOccupancy} orang</span>
            </div>
            <div className="flex items-center text-gray-600">
              {getGenderIcon()}
              <span className="ml-1">
                {genderPreference === 'male' ? 'Putra' : 
                 genderPreference === 'female' ? 'Putri' : 'Campur'}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-baseline">
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(lowestPrice)}
              </p>
              <span className="text-sm text-gray-500 ml-1">/bulan</span>
            </div>

            {hasAlternativePricing && (
              <p className="text-sm text-gray-500 mt-1">
                Tersedia sewa {[
                  roomTypes.some(rt => rt.enable_daily_price) && 'harian',
                  roomTypes.some(rt => rt.enable_weekly_price) && 'mingguan',
                  roomTypes.some(rt => rt.enable_yearly_price) && 'tahunan'
                ].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { 
  MapPin, Users, Bath, Wifi, Coffee, Phone, Mail, MessageCircle, Send, 
  ArrowLeft, ChevronLeft, ChevronRight, Share, Heart, Building2, User, 
  DoorClosed, Loader2, Table, Armchair as Chair, Bed, Shirt, Tv, Wind, 
  CircleDot, Scale as Male, Scale as Female, Users2, Bike, Car, Camera,
  Sun, Shield, Clock
} from 'lucide-react';
import Button from '../components/ui/Button';

const facilityIcons: Record<string, React.ReactNode> = {
  'Meja': <Table className="h-5 w-5 text-blue-600" />,
  'Kursi': <Chair className="h-5 w-5 text-blue-600" />,
  'WiFi': <Wifi className="h-5 w-5 text-blue-600" />,
  'Kasur Single': <Bed className="h-5 w-5 text-blue-600" />,
  'Lemari': <Shirt className="h-5 w-5 text-blue-600" />,
  'AC': <Wind className="h-5 w-5 text-blue-600" />,
  'TV': <Tv className="h-5 w-5 text-blue-600" />
};

const parkingIcons: Record<string, React.ReactNode> = {
  'Parkir Motor': <Bike className="h-5 w-5 text-blue-600" />,
  'Parkir Mobil': <Car className="h-5 w-5 text-blue-600" />,
  'Parkir Sepeda': <Bike className="h-5 w-5 text-blue-600" />,
  'CCTV Parkir': <Camera className="h-5 w-5 text-blue-600" />,
  'Atap Parkir': <Sun className="h-5 w-5 text-blue-600" />,
  'Penjaga Parkir': <Shield className="h-5 w-5 text-blue-600" />,
  'Parkir 24 Jam': <Clock className="h-5 w-5 text-blue-600" />
};

const getFacilityIcon = (facilityName: string) => {
  return facilityIcons[facilityName] || <CircleDot className="h-5 w-5 text-blue-600" />;
};

const getParkingIcon = (facilityName: string) => {
  return parkingIcons[facilityName] || <CircleDot className="h-5 w-5 text-blue-600" />;
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
      return <Male className="h-5 w-5 text-blue-600" />;
    case 'female':
      return <Female className="h-5 w-5 text-pink-600" />;
    default:
      return <Users2 className="h-5 w-5 text-purple-600" />;
  }
};

const getGenderText = (gender: string) => {
  switch (gender) {
    case 'male':
      return 'Putra';
    case 'female':
      return 'Putri';
    default:
      return 'Campur';
  }
};

const PropertyDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    loadPropertyDetails();
    checkIfSaved();
  }, [id]);

  const loadPropertyDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [propertyData, roomTypesData] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .eq('marketplace_enabled', true)
          .eq('marketplace_status', 'published')
          .single(),
        supabase.from('room_types').select('*').eq('property_id', id),
      ]);
      if (propertyData.error || !propertyData.data) throw propertyData.error;
      if (roomTypesData.error) throw roomTypesData.error;

      setProperty(propertyData.data);
      setRoomTypes(roomTypesData.data || []);
      if (roomTypesData.data && roomTypesData.data.length > 0) {
        setSelectedRoomType(roomTypesData.data[0]);
      }
    } catch (err) {
      console.error('Error loading property details:', err);
      setError('Gagal memuat detail properti');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;
      const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('property_id', id)
        .eq('user_id', user.id)
        .single();
      setIsSaved(!!data);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSaveProperty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      if (isSaved) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('property_id', id)
          .eq('user_id', user.id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_properties')
          .insert([{ property_id: id, user_id: user.id }]);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handleWhatsAppClick = () => {
    if (!property) return;
    const message = `Halo, saya tertarik dengan properti ${property.name} di ${property.city}. Bisakah kita berdiskusi lebih lanjut?`;
    const phoneNumber = property.phone?.startsWith('0')
      ? '62' + property.phone.slice(1)
      : property.phone;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.name,
        text: `Lihat properti ini: ${property?.name} di ${property?.city}`,
        url: window.location.href,
      });
    }
  };

  const handleChatClick = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth', { state: { from: location.pathname } });
        return;
      }

      navigate('/marketplace/chat', { 
        state: { 
          receiverId: property?.owner_id,
          propertyId: property?.id,
          propertyName: property?.name
        } 
      });
    } catch (err) {
      console.error('Error handling chat:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Properti tidak ditemukan'}</h2>
        <button
          onClick={() => navigate('/marketplace')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Kembali ke Marketplace
        </button>
      </div>
    );
  }

  const allImages = [
    ...(property.photos || []),
    ...(property.common_amenities_photos || []),
    ...(property.parking_amenities_photos || []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 lg:bg-white">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 safe-top">
        <div className="px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/marketplace')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm"
            >
              <Share className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={handleSaveProperty}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm"
            >
              <Heart
                className={`h-5 w-5 ${
                  isSaved ? 'text-red-500 fill-current' : 'text-gray-700'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Kembali
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{property.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <Share className="h-5 w-5" />
              <span>Bagikan</span>
            </button>
            <button
              onClick={handleSaveProperty}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <Heart
                className={`h-5 w-5 ${
                  isSaved ? 'text-red-500 fill-current' : ''
                }`}
              />
              <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="relative aspect-[4/3] lg:rounded-2xl overflow-hidden bg-gray-100">
              {allImages.length > 0 ? (
                <>
                  <img
                    src={allImages[activeImageIndex]}
                    alt={`${property.name} - Image ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <button
                      onClick={() => setActiveImageIndex(prev => 
                        prev === 0 ? allImages.length - 1 : prev - 1
                      )}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex(prev =>
                        prev === allImages.length - 1 ? 0 : prev + 1
                      )}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <p className="text-white text-sm">
                        {activeImageIndex + 1} / {allImages.length}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 size={48} className="text-gray-300" />
                </div>
              )}
            </div>

            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
              <div className="mt-2 flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <p>{property.address}, {property.city}</p>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-l font-semibold ${getRoomTypeColor(selectedRoomType?.name || roomTypes[0]?.name || 'standard')}`}>
                    {selectedRoomType?.name || roomTypes[0]?.name || 'Standard'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-600">
                    Maks. {selectedRoomType?.max_occupancy || roomTypes[0]?.max_occupancy || 1} orang
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 rounded-full">
                    {getGenderIcon(selectedRoomType?.renter_gender || roomTypes[0]?.renter_gender || 'any')}
                  </div>
                  <span className="text-gray-600">
                    {getGenderText(selectedRoomType?.renter_gender || roomTypes[0]?.renter_gender || 'any')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Mengenai kost ini
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          </div>

          <div className="px-4 lg:px-0">
            <div className="mt-6 lg:mt-0 bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Harga Sewa
              </h2>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-blue-600">
                  {formatCurrency(selectedRoomType?.price || roomTypes[0]?.price || 0)}
                </span>
                <span className="ml-2 text-gray-500">/bulan</span>
              </div>
              {selectedRoomType?.enable_daily_price && (
                <p className="mt-2 text-gray-600">
                  Harian: {formatCurrency(selectedRoomType.daily_price || 0)}
                </p>
              )}
              {selectedRoomType?.enable_weekly_price && (
                <p className="mt-1 text-gray-600">
                  Mingguan: {formatCurrency(selectedRoomType.weekly_price || 0)}
                </p>
              )}
              {selectedRoomType?.enable_yearly_price && (
                <p className="mt-1 text-gray-600">
                  Tahunan: {formatCurrency(selectedRoomType.yearly_price || 0)}
                </p>
              )}
            </div>

            {selectedRoomType?.room_facilities?.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Fasilitas Kamar
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRoomType.room_facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-xl"
                    >
                      {getFacilityIcon(facility)}
                      <span className="text-gray-700 ml-3">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRoomType?.bathroom_facilities?.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Fasilitas Toilet
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRoomType.bathroom_facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-xl"
                    >
                      {getFacilityIcon(facility)}
                      <span className="text-gray-700 ml-3">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.common_amenities?.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Fasilitas Umum
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.common_amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-xl"
                    >
                      <Coffee className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.parking_amenities?.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Fasilitas Parkir
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.parking_amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-xl"
                    >
                      {getParkingIcon(amenity)}
                      <span className="text-gray-700 ml-3">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.rules?.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Peraturan Kost
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.rules.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-xl"
                    >
                      <Coffee className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Kontak
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{property.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{property.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 safe-bottom">
        <div className="max-w-7xl mx-auto flex gap-4">
          <Button
            className="flex-1"
            onClick={handleChatClick}
            icon={<MessageCircle size={20} />}
          >
            Chat
          </Button>
          <Button
            variant="success"
            className="flex-1"
            onClick={handleWhatsAppClick}
            icon={<Send size={20} />}
          >
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import {
  MapPin,
  Users,
  Bath,
  Wifi,
  Car,
  Coffee,
  Phone,
  Mail,
  MessageCircle,
  Send,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Share,
  Heart,
} from 'lucide-react';
import Button from '../components/ui/Button';

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
        setSelectedRoomType(roomTypesData.data[0]); // Set default selected room type
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

  const handlePrevImage = () => {
    if (!property) return;
    const allImages = [
      ...(property.photos || []),
      ...(property.common_amenities_photos || []),
      ...(property.parking_amenities_photos || []),
    ];
    setActiveImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!property) return;
    const allImages = [
      ...(property.photos || []),
      ...(property.common_amenities_photos || []),
      ...(property.parking_amenities_photos || []),
    ];
    setActiveImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleChatClick = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth', { state: { from: location.pathname } });
        return;
      }

      // Navigate to chat page with property owner's ID
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  // Combine all images
  const allImages = [
    ...(property.photos || []),
    ...(property.common_amenities_photos || []),
    ...(property.parking_amenities_photos || []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali
            </button>
            <div className="flex items-center gap-4">
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100">
                <Share className="h-5 w-5 text-gray-600" />
              </button>
              <button onClick={handleSaveProperty} className="p-2 rounded-full hover:bg-gray-100">
                <Heart
                  className={`h-5 w-5 ${
                    isSaved ? 'text-red-500 fill-current' : 'text-gray-600'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              {/* Image Gallery */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={allImages[activeImageIndex]}
                      alt={`${property.name} - Gambar ${activeImageIndex + 1}`}
                      className="w-full object-cover aspect-[16/9]"
                    />
                    {/* Navigation Buttons */}
                    <div className="absolute inset-0 flex items-center justify-between p-4">
                      <button
                        onClick={handlePrevImage}
                        className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                    {/* Dot Navigation */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex gap-2">
                        {allImages.map((_, index) => (
                          <button
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            onClick={() => setActiveImageIndex(index)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-[400px] flex items-center justify-center">
                    <span className="text-gray-400">Tidak ada gambar</span>
                  </div>
                )}
              </div>

              {/* Cards Informasi Kost */}
              <div className="space-y-6 mt-6">
                {/* Card 1: Identitas Kost */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{property.name}</h1>
                  <div className="text-gray-600 mb-4">
                    <p className="font-semibold text-gray-800">
                      {selectedRoomType?.name || roomTypes[0]?.name || 'Kamar'}
                    </p>
                    <p className="text-sm">{property.address}, {property.city}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 border-t pt-3 mt-3">
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-gray-500" />
                      Maksimal {selectedRoomType?.max_occupancy || roomTypes[0]?.max_occupancy || 1} orang
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-4 h-4 rounded-full mr-2 ${
                          selectedRoomType?.gender_renter === 'Campur'
                            ? 'bg-blue-200'
                            : selectedRoomType?.gender_renter === 'Putra'
                            ? 'bg-indigo-200'
                            : 'bg-pink-200'
                        }`}
                      ></span>
                      {selectedRoomType?.gender_renter || roomTypes[0]?.gender_renter || 'Campur'}
                    </div>
                  </div>
                </div>

                {/* Card 2: Harga Sewa */}
                {roomTypes.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Harga Sewa</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Bulanan</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(selectedRoomType?.price || roomTypes[0]?.price || 0)}
                        </span>
                      </div>
                      {selectedRoomType?.enable_daily_price && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Harian</span>
                          <span>{formatCurrency(selectedRoomType.daily_price || 0)}</span>
                        </div>
                      )}
                      {selectedRoomType?.enable_weekly_price && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Mingguan</span>
                          <span>{formatCurrency(selectedRoomType.weekly_price || 0)}</span>
                        </div>
                      )}
                      {selectedRoomType?.enable_yearly_price && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Tahunan</span>
                          <span>{formatCurrency(selectedRoomType.yearly_price || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card 3: Deskripsi Kost */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Deskripsi Kost</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedRoomType?.description ||
                      roomTypes[0]?.description ||
                      'Tidak ada deskripsi tersedia.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Room Facilities */}
              {selectedRoomType?.room_facilities?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Fasilitas Kamar</h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoomType.room_facilities.map((facility, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-gray-700">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bathroom Facilities */}
              {selectedRoomType?.bathroom_facilities?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Fasilitas Kamar Mandi</h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoomType.bathroom_facilities.map((facility, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-gray-700">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Amenities */}
              {property.common_amenities?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Fasilitas Umum</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.common_amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parking Amenities */}
              {property.parking_amenities?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Fasilitas Parkir</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.parking_amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* House Rules */}
              {property.rules?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Peraturan Kost</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.rules.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-gray-700">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kontak</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Phone className="text-gray-400 mr-3" size={20} />
                    <span>{property.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="text-gray-400 mr-3" size={20} />
                    <span>{property.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-2 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleChatClick}
              icon={<MessageCircle size={20} />}
            >
              Chat dengan Pemilik
            </Button>
            <Button
              variant="success"
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={handleWhatsAppClick}
              icon={<Send size={20} />}
            >
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Building2, MapPin, Phone, Mail, Users, Bath, Home, Wifi, Car, Coffee, DoorClosed, MessageSquare, Send } from 'lucide-react';
import Button from '../ui/Button';

interface PropertyDetailsProps {
  property: Property;
  roomTypes: RoomType[];
  onClose: () => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, roomTypes, onClose }) => {
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  // Combine all images from property and room types
  const allImages = [
    ...(property.photos || []),
    ...(property.common_amenities_photos || []),
    ...(property.parking_amenities_photos || [])
  ];

  const handleWhatsAppClick = () => {
    const message = `Halo, saya tertarik dengan properti ${property.name} di ${property.city}. Bisakah kita berdiskusi lebih lanjut?`;
    const phoneNumber = property.phone?.startsWith('0')
      ? '62' + property.phone.slice(1)
      : property.phone;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8">
        {/* Image Gallery */}
        <div className="relative">
          <div className="h-96">
            {allImages.length > 0 ? (
              <img
                src={allImages[activeImageIndex]}
                alt={`${property.name} - Image ${activeImageIndex + 1}`}
                className="w-full h-full object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg">
                <Building2 size={64} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <div className="bg-black bg-opacity-50 p-2 rounded-lg flex gap-2">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeImageIndex ? 'bg-white' : 'bg-gray-400'
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <div className="flex items-center text-gray-600 mt-2">
              <MapPin size={20} className="mr-2" />
              <p>{property.address}, {property.city}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Informasi Kontak</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Phone className="text-blue-500 mr-3" size={20} />
                <p>{property.phone}</p>
              </div>
              <div className="flex items-center">
                <Mail className="text-blue-500 mr-3" size={20} />
                <p>{property.email}</p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Fasilitas Umum</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {property.common_amenities.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                  <Coffee className="text-blue-500" size={20} />
                  <span className="text-gray-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Parking Facilities */}
          {property.parking_amenities.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Fasilitas Parkir</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {property.parking_amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <Car className="text-blue-500" size={20} />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Types */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Tipe Kamar</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roomTypes.map(roomType => (
                <div
                  key={roomType.id}
                  className={`border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedRoomType?.id === roomType.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                  onClick={() => setSelectedRoomType(roomType)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{roomType.name}</h3>
                      <p className="text-gray-600">{roomType.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(roomType.price)}
                        <span className="text-sm font-normal text-gray-500">/bulan</span>
                      </p>
                      {roomType.enable_daily_price && (
                        <p className="text-sm text-gray-600">
                          {formatCurrency(roomType.daily_price || 0)}/hari
                        </p>
                      )}
                      {roomType.enable_weekly_price && (
                        <p className="text-sm text-gray-600">
                          {formatCurrency(roomType.weekly_price || 0)}/minggu
                        </p>
                      )}
                      {roomType.enable_yearly_price && (
                        <p className="text-sm text-gray-600">
                          {formatCurrency(roomType.yearly_price || 0)}/tahun
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <Users size={18} className="mr-2" />
                      <span>Maksimal {roomType.max_occupancy} orang</span>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Fasilitas Kamar:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roomType.room_facilities?.map((facility, index) => (
                          <div key={index} className="flex items-center text-gray-600">
                            <DoorClosed size={16} className="mr-2 text-blue-500" />
                            {facility}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Fasilitas Kamar Mandi:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roomType.bathroom_facilities?.map((facility, index) => (
                          <div key={index} className="flex items-center text-gray-600">
                            <Bath size={16} className="mr-2 text-blue-500" />
                            {facility}
                          </div>
                        ))}
                      </div>
                    </div>

                    {roomType.photos && roomType.photos.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Foto Kamar:</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {roomType.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`${roomType.name} photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg cursor-pointer"
                              onClick={() => {
                                const photoIndex = allImages.indexOf(photo);
                                if (photoIndex !== -1) {
                                  setActiveImageIndex(photoIndex);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          {property.rules && property.rules.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Peraturan Kost</h2>
              <ul className="list-disc list-inside space-y-2">
                {property.rules.map((rule, index) => (
                  <li key={index} className="text-gray-700">{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <Button
              className="flex-1"
              onClick={() => navigate('/login')}
              icon={<MessageSquare size={20} />}
            >
              Chat dengan Pengelola
            </Button>
            <Button
              variant="success"
              className="flex-1"
              onClick={handleWhatsAppClick}
              icon={<Send size={20} />}
            >
              Hubungi via WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;

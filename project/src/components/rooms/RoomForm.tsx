import React, { useState, useEffect } from 'react';
import { Room, RoomType } from '../../types';
import Button from '../ui/Button';
import { X } from 'lucide-react';
import { useProperty } from '../../contexts/PropertyContext';
import { supabase } from '../../lib/supabase';
import { useSubscriptionFeatures } from '../../hooks/useSubscriptionFeatures';

interface RoomFormProps {
  room?: Room;
  onSubmit: (data: Partial<Room>) => void;
  onClose: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({ room, onSubmit, onClose }) => {
  const { selectedProperty } = useProperty();
  const { hasFeature } = useSubscriptionFeatures();
  const hasMarketplaceAccess = hasFeature('marketplace_listing');
  
  const [formData, setFormData] = useState<Partial<Room>>({
    name: room?.name || '',
    floor: room?.floor || '',
    type: room?.type || '',
    price: room?.price || 0,
    status: room?.status || 'vacant',
    property_id: selectedProperty?.id
  });

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProperty?.id && hasMarketplaceAccess) {
      loadRoomTypes();
    }
  }, [selectedProperty, hasMarketplaceAccess]);

  const loadRoomTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('property_id', selectedProperty?.id)
        .order('name');

      if (error) throw error;
      setRoomTypes(data || []);
    } catch (err) {
      console.error('Error loading room types:', err);
      setError('Failed to load room types');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type' && hasMarketplaceAccess) {
      // When room type is selected, get price from room type
      const selectedType = roomTypes.find(type => type.name === value);
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          type: value,
          price: selectedType.price
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {room ? 'Edit Kamar' : 'Tambah Kamar'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Kamar
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lantai
            </label>
            <input
              type="text"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {hasMarketplaceAccess ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Kamar
              </label>
              {roomTypes.length > 0 ? (
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih tipe kamar</option>
                  {roomTypes.map(type => (
                    <option key={type.id} value={type.name}>
                      {type.name} - {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(type.price)}/bulan
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500 mb-2">
                  Belum ada tipe kamar. Silakan tambahkan tipe kamar terlebih dahulu di menu Pengaturan Marketplace.
                </div>
              )}
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga per Bulan
                </label>
                <input
                  type="number"
                  value={formData.price}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Harga diatur otomatis berdasarkan tipe kamar
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga per Bulan
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">
              {room ? 'Simpan Perubahan' : 'Tambah Kamar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomForm;

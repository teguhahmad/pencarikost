import React, { useState, useRef } from 'react';
import { RoomType } from '../../types';
import Button from '../ui/Button';
import { X, ImageIcon, Loader2, Trash, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface RoomTypeFormProps {
  roomType?: RoomType;
  onSubmit: (data: Partial<RoomType>) => void;
  onClose: () => void;
}

const ROOM_FACILITIES = [
  'AC', 'TV', 'WiFi', 'Lemari', 'Meja', 'Kursi', 'Kasur Single', 'Kasur Double'
];

const BATHROOM_FACILITIES = [
  'Kamar Mandi Dalam', 'Shower', 'Water Heater', 'Kloset Duduk', 'Wastafel'
];

const RoomTypeForm: React.FC<RoomTypeFormProps> = ({
  roomType,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<RoomType>>({
    name: roomType?.name || '',
    price: roomType?.price || 0,
    daily_price: roomType?.daily_price || 0,
    weekly_price: roomType?.weekly_price || 0,
    yearly_price: roomType?.yearly_price || 0,
    enable_daily_price: roomType?.enable_daily_price || false,
    enable_weekly_price: roomType?.enable_weekly_price || false,
    enable_yearly_price: roomType?.enable_yearly_price || false,
    description: roomType?.description || '',
    room_facilities: roomType?.room_facilities || [],
    bathroom_facilities: roomType?.bathroom_facilities || [],
    photos: roomType?.photos || [],
    max_occupancy: roomType?.max_occupancy || 1,
    renter_gender: roomType?.renter_gender || 'any'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFacilityChange = (facility: string, type: 'room' | 'bathroom') => {
    const field = type === 'room' ? 'room_facilities' : 'bathroom_facilities';
    const facilities = formData[field] || [];
    const newFacilities = facilities.includes(facility)
      ? facilities.filter(f => f !== facility)
      : [...facilities, facility];
    
    setFormData(prev => ({
      ...prev,
      [field]: newFacilities
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress: number) => {
            setUploadProgress((i / totalFiles * 100) + (progress / totalFiles));
          }
        };

        const compressedFile = await imageCompression(file, options);
        
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('type', 'room');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await response.json();
        uploadedUrls.push(url);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...uploadedUrls]
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = async (url: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ url })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setFormData(prev => ({
        ...prev,
        photos: prev.photos?.filter(photo => photo !== url) || []
      }));
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove photo. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {roomType ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informasi Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Tipe
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
                  Kapasitas Maksimal
                </label>
                <select
                  name="max_occupancy"
                  value={formData.max_occupancy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 Orang</option>
                  <option value={2}>2 Orang</option>
                  <option value={3}>3 Orang</option>
                  <option value={4}>4 Orang</option>
                  <option value={5}>5 Orang</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin Penyewa
                </label>
                <select
                  name="renter_gender"
                  value={formData.renter_gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Laki-Laki</option>
                  <option value="female">Perempuan</option>
                  <option value="any">Campur</option>
                </select>
              </div>

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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Price Options */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Opsi Harga Tambahan</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="enable_daily_price"
                    checked={formData.enable_daily_price}
                    onChange={handleCheckboxChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Aktifkan Harga Harian
                  </label>
                </div>
                {formData.enable_daily_price && (
                  <input
                    type="number"
                    name="daily_price"
                    value={formData.daily_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="Harga per hari"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="enable_weekly_price"
                    checked={formData.enable_weekly_price}
                    onChange={handleCheckboxChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Aktifkan Harga Mingguan
                  </label>
                </div>
                {formData.enable_weekly_price && (
                  <input
                    type="number"
                    name="weekly_price"
                    value={formData.weekly_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="Harga per minggu"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="enable_yearly_price"
                    checked={formData.enable_yearly_price}
                    onChange={handleCheckboxChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Aktifkan Harga Tahunan
                  </label>
                </div>
                {formData.enable_yearly_price && (
                  <input
                    type="number"
                    name="yearly_price"
                    value={formData.yearly_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="Harga per tahun"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Fasilitas</h3>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Fasilitas Kamar</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ROOM_FACILITIES.map(facility => (
                  <label key={facility} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.room_facilities?.includes(facility)}
                      onChange={() => handleFacilityChange(facility, 'room')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{facility}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Fasilitas Kamar Mandi</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {BATHROOM_FACILITIES.map(facility => (
                  <label key={facility} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.bathroom_facilities?.includes(facility)}
                      onChange={() => handleFacilityChange(facility, 'bathroom')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{facility}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Foto Kamar</h3>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                icon={isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              >
                {isUploading ? 'Mengupload...' : 'Upload Foto'}
              </Button>
            </div>

            {isUploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round(uploadProgress)}% selesai
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.photos?.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Room type photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 -mb-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">
              {roomType ? 'Simpan Perubahan' : 'Tambah Tipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomTypeForm;
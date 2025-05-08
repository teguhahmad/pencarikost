import React from 'react';
import { MaintenanceRequest, Room, Tenant } from '../../types';
import Button from '../ui/Button';
import { X } from 'lucide-react';

interface MaintenanceFormProps {
  request?: MaintenanceRequest;
  rooms: Room[];
  tenants: Tenant[];
  onSubmit: (data: Partial<MaintenanceRequest>) => void;
  onClose: () => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  request,
  rooms,
  tenants,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = React.useState<Partial<MaintenanceRequest>>({
    room_id: request?.room_id || '',
    tenant_id: request?.tenant_id || '',
    title: request?.title || '',
    description: request?.description || '',
    date: request?.date || new Date().toISOString().split('T')[0],
    status: request?.status || 'pending',
    priority: request?.priority || 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {request ? 'Ubah Permintaan Pemeliharaan' : 'Permintaan Pemeliharaan Baru'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kamar
            </label>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih kamar</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Kamar {room.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dilaporkan Oleh (Opsional)
            </label>
            <select
              name="tenant_id"
              value={formData.tenant_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih penyewa</option>
              {tenants.filter(tenant => tenant.status === 'active').map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioritas
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="pending">Menunggu</option>
              <option value="in-progress">Dalam Proses</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Dilaporkan
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">
              {request ? 'Simpan Perubahan' : 'Tambah Permintaan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;
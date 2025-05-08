import React, { useState, useEffect } from 'react';
import { Payment, Tenant, Room } from '../../types';
import Button from '../ui/Button';
import { X } from 'lucide-react';
import { useProperty } from '../../contexts/PropertyContext';
import { supabase } from '../../lib/supabase';

interface PaymentFormProps {
  payment?: Payment;
  tenants: Tenant[];
  rooms: Room[];
  onSubmit: (data: Partial<Payment>) => void;
  onClose: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  payment, 
  tenants,
  rooms,
  onSubmit, 
  onClose 
}) => {
  const { selectedProperty } = useProperty();
  const [formData, setFormData] = React.useState<Partial<Payment>>({
    tenantId: payment?.tenantId || '',
    roomId: payment?.roomId || '',
    amount: payment?.amount || 0,
    date: payment?.date || new Date().toISOString().split('T')[0],
    dueDate: payment?.dueDate || '',
    status: payment?.status || 'pending',
    paymentMethod: payment?.paymentMethod || 'transfer',
    notes: payment?.notes || '',
    property_id: selectedProperty?.id || null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When tenant is selected, set due date from tenant's end_date
  useEffect(() => {
    if (formData.tenantId) {
      const tenant = tenants.find(t => t.id === formData.tenantId);
      if (tenant) {
        setFormData(prev => ({
          ...prev,
          dueDate: tenant.end_date,
          roomId: tenant.room_id || null
        }));
      }
    }
  }, [formData.tenantId, tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty?.id) {
      setError('No property selected');
      return;
    }

    if (!formData.tenantId) {
      setError('Please select a tenant');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const paymentData = {
        ...formData,
        property_id: selectedProperty.id,
        status: formData.date ? 'paid' : 'pending',
        tenantId: formData.tenantId || null,
        roomId: formData.roomId || null
      };

      // Update tenant payment status
      if (formData.tenantId) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ 
            payment_status: paymentData.status
          })
          .eq('id', formData.tenantId);

        if (tenantError) throw tenantError;
      }

      await onSubmit(paymentData);
      onClose();
    } catch (err) {
      console.error('Error saving payment:', err);
      setError('Failed to save payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'tenantId') {
      // If value is empty string, set both tenantId and roomId to null
      if (!value) {
        setFormData(prev => ({ 
          ...prev, 
          tenantId: null,
          roomId: null
        }));
      } else {
        const tenant = tenants.find(t => t.id === value);
        setFormData(prev => ({ 
          ...prev, 
          tenantId: value,
          roomId: tenant?.room_id || null
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value || null }));
    }
  };

  // Filter active tenants
  const activeTenants = tenants.filter(tenant => tenant.status === 'active');

  // Get room details for selected tenant
  const selectedTenant = tenants.find(t => t.id === formData.tenantId);
  const selectedRoom = rooms.find(r => r.id === selectedTenant?.room_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Catat Pembayaran
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penyewa
            </label>
            <select
              name="tenantId"
              value={formData.tenantId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih penyewa</option>
              {activeTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>

          {selectedRoom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kamar
              </label>
              <input
                type="text"
                value={`Kamar ${selectedRoom.name}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                disabled
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pembayaran
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Kosongkan jika pembayaran belum dilakukan
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jatuh Tempo
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              Tanggal jatuh tempo sesuai dengan tanggal berakhir sewa
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="transfer">Transfer Bank</option>
              <option value="cash">Tunai</option>
              <option value="card">Kartu Kredit/Debit</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tambahkan catatan jika diperlukan..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              variant="success"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
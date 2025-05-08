import React from 'react';
import { Payment } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { X, Receipt, User, DoorClosed, Calendar, CreditCard, FileText } from 'lucide-react';
import { formatCurrency, formatDate, getPaymentStatusColor } from '../../utils/formatters';

interface PaymentDetailsProps {
  payment: Payment;
  tenantName?: string;
  roomNumber?: string;
  onClose: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  payment,
  tenantName,
  roomNumber,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Detail Pembayaran
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status</span>
            <Badge className={getPaymentStatusColor(payment.status)}>
              {payment.status === 'paid' ? 'Lunas' : 
               payment.status === 'pending' ? 'Menunggu' : 'Terlambat'}
            </Badge>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Receipt size={20} />
              <span>Jumlah</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
          </div>

          {/* Tenant Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User size={20} className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Penyewa</p>
                <p className="font-medium text-gray-900">{tenantName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DoorClosed size={20} className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Kamar</p>
                <p className="font-medium text-gray-900">Kamar {roomNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Jatuh Tempo</p>
                <p className="font-medium text-gray-900">{formatDate(payment.dueDate)}</p>
              </div>
            </div>

            {payment.date && (
              <div className="flex items-start gap-3">
                <CreditCard size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal Pembayaran</p>
                  <p className="font-medium text-gray-900">{formatDate(payment.date)}</p>
                  {payment.paymentMethod && (
                    <p className="text-sm text-gray-500">
                      via {payment.paymentMethod === 'transfer' ? 'Transfer Bank' :
                           payment.paymentMethod === 'cash' ? 'Tunai' :
                           payment.paymentMethod === 'card' ? 'Kartu Kredit/Debit' : 'E-Wallet'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {payment.notes && (
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Catatan</p>
                  <p className="text-gray-900">{payment.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
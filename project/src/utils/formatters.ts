/**
 * Format number as Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date to locale string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get status color based on payment status
 */
export const getPaymentStatusColor = (status: 'paid' | 'pending' | 'overdue'): string => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get status color based on room status
 */
export const getRoomStatusColor = (status: 'occupied' | 'vacant' | 'maintenance'): string => {
  switch (status) {
    case 'occupied':
      return 'bg-blue-100 text-blue-800';
    case 'vacant':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get status color based on maintenance request priority
 */
export const getMaintenancePriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
  switch (priority) {
    case 'low':
      return 'bg-blue-100 text-blue-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get status color based on maintenance request status
 */
export const getMaintenanceStatusColor = (status: 'pending' | 'in-progress' | 'completed'): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Translate payment status to Indonesian
 */
export const translatePaymentStatus = (status: 'paid' | 'pending' | 'overdue'): string => {
  switch (status) {
    case 'paid':
      return 'Lunas';
    case 'pending':
      return 'Menunggu';
    case 'overdue':
      return 'Terlambat';
    default:
      return status;
  }
};

/**
 * Translate room status to Indonesian
 */
export const translateRoomStatus = (status: 'occupied' | 'vacant' | 'maintenance'): string => {
  switch (status) {
    case 'occupied':
      return 'Terisi';
    case 'vacant':
      return 'Kosong';
    case 'maintenance':
      return 'Perbaikan';
    default:
      return status;
  }
};

/**
 * Translate maintenance priority to Indonesian
 */
export const translateMaintenancePriority = (priority: 'low' | 'medium' | 'high'): string => {
  switch (priority) {
    case 'low':
      return 'Rendah';
    case 'medium':
      return 'Sedang';
    case 'high':
      return 'Tinggi';
    default:
      return priority;
  }
};

/**
 * Translate maintenance status to Indonesian
 */
export const translateMaintenanceStatus = (status: 'pending' | 'in-progress' | 'completed'): string => {
  switch (status) {
    case 'pending':
      return 'Menunggu';
    case 'in-progress':
      return 'Dalam Proses';
    case 'completed':
      return 'Selesai';
    default:
      return status;
  }
};
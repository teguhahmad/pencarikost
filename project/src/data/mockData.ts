import { Tenant, Room, Payment, MaintenanceRequest, FinancialSummary, OccupancySummary } from '../types';

export const tenants: Tenant[] = [];
export const rooms: Room[] = [];
export const payments: Payment[] = [];
export const maintenanceRequests: MaintenanceRequest[] = [];

export const getFinancialSummary = (): FinancialSummary => {
  const totalRevenue = payments.reduce((sum, payment) => {
    return payment.status === 'paid' ? sum + payment.amount : sum;
  }, 0);

  const pendingPayments = payments.reduce((sum, payment) => {
    return payment.status === 'pending' ? sum + payment.amount : sum;
  }, 0);

  const overduePayments = payments.reduce((sum, payment) => {
    return payment.status === 'overdue' ? sum + payment.amount : sum;
  }, 0);

  return {
    totalRevenue,
    pendingPayments,
    overduePayments,
    monthlyIncome: 0
  };
};

export const getOccupancySummary = (): OccupancySummary => {
  const total = rooms.length;
  const occupied = rooms.filter(room => room.status === 'occupied').length;
  const vacant = rooms.filter(room => room.status === 'vacant').length;
  const maintenance = rooms.filter(room => room.status === 'maintenance').length;
  const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

  return {
    total,
    occupied,
    vacant,
    maintenance,
    occupancyRate
  };
};
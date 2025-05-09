import { supabase } from '../lib/supabase';
import { Property, Room, Tenant, Payment, MaintenanceRequest, Notification } from '../types';

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  payment_reminders: boolean;
  maintenance_updates: boolean;
  new_tenants: boolean;
  currency: string;
  date_format: string;
  payment_reminder_days: number;
  session_timeout: number;
  login_notifications: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyStats {
  total_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  total_tenants: number;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  pending_payments: number;
  maintenance_costs: number;
  avg_room_price: number;
  payment_collection_rate: number;
  overdue_payments: number;
  avg_tenant_stay: number;
  tenant_turnover_rate: number;
  maintenance_requests_open: number;
  maintenance_requests_total: number;
}

export const autoBillingService = {
  async processAutoBilling() {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-billing`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process auto billing');
    }

    return response.json();
  }
};

export const propertyStatsService = {
  async getStats(propertyId: string): Promise<PropertyStats> {
    // Get rooms
    const { data: rooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId);

    const totalRooms = rooms?.length || 0;
    const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const avgRoomPrice = rooms?.reduce((sum, room) => sum + Number(room.price), 0) / totalRooms || 0;

    // Get tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('*')
      .eq('property_id', propertyId);

    const activeTenants = tenants?.filter(t => t.status === 'active') || [];
    const totalTenants = activeTenants.length;

    // Calculate average tenant stay in months
    const avgTenantStay = activeTenants.reduce((sum, tenant) => {
      const start = new Date(tenant.start_date);
      const end = new Date(tenant.end_date);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
      return sum + months;
    }, 0) / (activeTenants.length || 1);

    // Calculate tenant turnover rate
    const { data: historicalTenants } = await supabase
      .from('tenants')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'inactive');

    const turnoverRate = historicalTenants 
      ? (historicalTenants.length / (historicalTenants.length + activeTenants.length)) * 100 
      : 0;

    // Get payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('property_id', propertyId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const monthlyPayments = payments?.filter(p => {
      const paymentDate = p.date ? new Date(p.date) : null;
      return paymentDate && paymentDate >= monthStart;
    }) || [];

    const yearlyPayments = payments?.filter(p => {
      const paymentDate = p.date ? new Date(p.date) : null;
      return paymentDate && paymentDate >= yearStart;
    }) || [];

    const totalRevenue = payments?.reduce((sum, payment) => 
      payment.status === 'paid' ? sum + Number(payment.amount) : sum, 0) || 0;

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => 
      payment.status === 'paid' ? sum + Number(payment.amount) : sum, 0);

    const yearlyRevenue = yearlyPayments.reduce((sum, payment) => 
      payment.status === 'paid' ? sum + Number(payment.amount) : sum, 0);

    const pendingPayments = payments?.reduce((sum, payment) => 
      payment.status === 'pending' ? sum + Number(payment.amount) : sum, 0) || 0;

    const overduePayments = payments?.reduce((sum, payment) => 
      payment.status === 'overdue' ? sum + Number(payment.amount) : sum, 0) || 0;

    const totalPayments = payments?.length || 0;
    const paidPayments = payments?.filter(p => p.status === 'paid').length || 0;
    const paymentCollectionRate = totalPayments > 0 
      ? (paidPayments / totalPayments) * 100 
      : 0;

    // Get maintenance requests
    const { data: maintenanceRequests } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('property_id', propertyId);

    const openRequests = maintenanceRequests?.filter(r => 
      r.status === 'pending' || r.status === 'in-progress'
    ).length || 0;

    const maintenanceCosts = maintenanceRequests?.reduce((sum, request) => {
      const estimatedCost = 
        request.priority === 'high' ? 1000000 :
        request.priority === 'medium' ? 500000 :
        250000;
      return sum + estimatedCost;
    }, 0) || 0;

    return {
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      yearly_revenue: yearlyRevenue,
      total_tenants: totalTenants,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      occupancy_rate: occupancyRate,
      pending_payments: pendingPayments,
      maintenance_costs: maintenanceCosts,
      avg_room_price: avgRoomPrice,
      payment_collection_rate: paymentCollectionRate,
      overdue_payments: overduePayments,
      avg_tenant_stay: Math.round(avgTenantStay),
      tenant_turnover_rate: Math.round(turnoverRate),
      maintenance_requests_open: openRequests,
      maintenance_requests_total: maintenanceRequests?.length || 0
    };
  }
};

export const settingsService = {
  async get(): Promise<UserSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // If no settings exist, create default settings
      if (error.code === 'PGRST116') {
        const defaultSettings = {
          user_id: user.id,
          email_notifications: true,
          payment_reminders: true,
          maintenance_updates: true,
          new_tenants: true,
          currency: 'IDR',
          date_format: 'DD/MM/YYYY',
          payment_reminder_days: 5,
          session_timeout: 30,
          login_notifications: true,
          two_factor_enabled: false
        };

        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        return newSettings;
      }
      throw error;
    }
    return data;
  },

  async update(settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const propertyService = {
  async getAll() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Property[];
  },

  async create(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) {
    const { data, error } = await supabase
      .from('properties')
      .insert([{ 
        ...property,
        owner_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  },

  async update(id: string, property: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({ ...property, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const roomService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId)
      .order('name');
    if (error) throw error;
    return data as Room[];
  },

  async create(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([room])
      .select()
      .single();
    if (error) throw error;
    return data as Room;
  },

  async update(id: string, room: Partial<Room>) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ ...room, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Room;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const tenantService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tenant[];
  },

  async create(tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('tenants')
      .insert([tenant])
      .select()
      .single();
    if (error) throw error;
    return data as Tenant;
  },

  async update(id: string, tenant: Partial<Tenant>) {
    const { data, error } = await supabase
      .from('tenants')
      .update({ ...tenant, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tenant;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const paymentService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Payment[];
  },

  async create(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async update(id: string, payment: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payments')
      .update({ ...payment, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteByTenantId(tenantId: string) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('tenantId', tenantId);
    if (error) throw error;
  }
};

export const maintenanceService = {
  async getByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MaintenanceRequest[];
  },

  async create(request: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([request])
      .select()
      .single();
    if (error) throw error;
    return data as MaintenanceRequest;
  },

  async update(id: string, request: Partial<MaintenanceRequest>) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ ...request, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MaintenanceRequest;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const notificationService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
      .eq('status', 'unread');

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async create(notification: Omit<Notification, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ ...notification, status: 'unread' }])
      .select()
      .single();
    if (error) throw error;
    return data as Notification;
  }
};
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  marketplace_enabled: boolean;
  marketplace_status: 'draft' | 'published';
  description?: string;
  common_amenities: string[];
  parking_amenities: string[];
  common_amenities_photos: string[];
  parking_amenities_photos: string[];
  rules: string[];
  photos: string[];
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  room_id: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
  payment_status: 'paid' | 'pending' | 'overdue';
  property_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Room {
  id: string;
  name: string;
  floor: string;
  type: 'standard' | 'deluxe' | 'suite' | 'single' | 'double';
  price: number;
  daily_price: number | null;
  weekly_price: number | null;
  yearly_price: number | null;
  enable_daily_price: boolean;
  enable_weekly_price: boolean;
  enable_yearly_price: boolean;
  status: 'occupied' | 'vacant' | 'maintenance';
  room_facilities: string[];
  bathroom_facilities: string[];
  photos: string[];
  max_occupancy: number;
  tenant_id?: string;
  property_id: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  room_id: string;
  amount: number;
  date: string | null;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  payment_method?: string;
  notes?: string;
  property_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRequest {
  id: string;
  room_id: string;
  tenant_id?: string;
  title: string;
  description: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  property_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface FinancialSummary {
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyIncome: number;
}

export interface OccupancySummary {
  total: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  occupancyRate: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'user' | 'property' | 'payment';
  status: 'unread' | 'read';
  created_at: string;
  target_user_id?: string;
  target_property_id?: string;
}

export interface Settings {
  paymentReminder: {
    daysBeforeDueDate: number;
    enabled: boolean;
  };
}

export interface RoomType {
  id: string;
  property_id: string;
  name: string;
  price: number;
  daily_price?: number;
  weekly_price?: number;
  yearly_price?: number;
  enable_daily_price?: boolean;
  enable_weekly_price?: boolean;
  enable_yearly_price?: boolean;
  description?: string;
  room_facilities: string[];
  bathroom_facilities: string[];
  photos: string[];
  max_occupancy: number;
  created_at?: string;
  updated_at?: string;
}
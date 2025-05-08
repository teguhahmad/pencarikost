export interface BackofficeUser {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'support';
  name: string;
  created_at: string;
  last_login?: string;
  status: 'active' | 'inactive';
}

export interface BackofficeNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'user' | 'property' | 'payment';
  status: 'unread' | 'read';
  created_at: string;
  target_user_id?: string;
  target_property_id?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, any>;
  created_at: string;
}

export interface BackofficeStats {
  total_users: number;
  total_properties: number;
  total_revenue: number;
  active_tenants: number;
}
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  max_properties: number;
  max_rooms_per_property: number;
  features: {
    tenant_data: boolean;
    auto_billing: boolean;
    billing_notifications: boolean;
    financial_reports: 'basic' | 'advanced' | 'predictive';
    data_backup: false | 'weekly' | 'daily' | 'realtime';
    multi_user: boolean;
    analytics: boolean | 'predictive';
    support: 'basic' | 'priority' | '24/7';
    marketplace_listing: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

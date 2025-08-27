export interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'Owner' | 'Manager' | 'Employee';
  photo_url?: string;
  store_id?: string;
  active: boolean;
  monthly_points_target: number;
  monthly_revenue_target: number;
  monthly_revenue_actual: number;
  monthly_points_balance: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedStore {
  id: string;
  name: string;
  location?: string;
  monthly_revenue_target: number;
  monthly_revenue_actual: number;
  monthly_points_total: number;
  staff_count: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedEvent {
  id: string;
  user_id: string;
  store_id?: string;
  type: 'positive' | 'negative' | 'sale' | 'review';
  points: number;
  amount?: number;
  reported_by: 'employee' | 'manager';
  evidence_url?: string;
  status: 'approved' | 'pending' | 'rejected';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedApproval {
  id: string;
  event_id: string;
  requested_by: string;
  approver_id?: string;
  note?: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
  decided_at?: string;
}

export interface RewardsCatalog {
  id: string;
  title: string;
  type: 'cash' | 'gift' | 'dayoff' | 'team';
  required_points: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
}

export interface AppSettings {
  id: string;
  points_to_euro_rate: number;
  min_redeem_points: number;
  self_report_negative_multiplier: number;
  extra_penalty_threshold: number;
  extra_penalty_euros: number;
  zero_sales_days_threshold: number;
  notifications_enabled: boolean;
  theme: 'light' | 'dark' | 'system';
  lang: 'el' | 'en';
  created_at: string;
  updated_at: string;
}

export interface KPIData {
  totalPoints: number;
  avgPointsPerEmployee: number;
  monthlyRevenue: {
    target: number;
    actual: number;
    forecast: number;
    variance: number;
    progress: number;
  };
  pendingApprovals: number;
}

export interface LeaderboardEntry {
  user: EnhancedUser;
  points: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Alert {
  id: string;
  type: 'zero_sales' | 'consecutive_negative' | 'budget_exceeded' | 'goal_80' | 'goal_100';
  user_id?: string;
  store_id?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface QuickAction {
  id: 'new-event' | 'new-employee' | 'new-store' | 'new-reward';
  label: string;
  icon: string;
  color: string;
}
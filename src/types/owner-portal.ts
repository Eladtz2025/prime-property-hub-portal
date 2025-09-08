// Types for the Owner Portal system

export interface DatabaseProperty {
  id: string;
  address: string;
  city: string;
  property_size?: number;
  floor?: number;
  rooms?: number;
  notes?: string;
  status: 'unknown' | 'occupied' | 'vacant' | 'maintenance';
  contact_status: 'not_contacted' | 'called_no_answer' | 'called_answered' | 'needs_callback';
  last_contact_date?: string;
  contact_notes?: string;
  contact_attempts: number;
  acquisition_cost?: number;
  renovation_costs?: number;
  current_market_value?: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyOwner {
  id: string;
  property_id: string;
  owner_id: string;
  ownership_percentage: number;
  created_at: string;
}

export interface Tenant {
  id: string;
  property_id: string;
  name: string;
  phone?: string;
  email?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  monthly_rent?: number;
  deposit_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialRecord {
  id: string;
  property_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  transaction_date: string;
  receipt_url?: string;
  created_by: string;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  name: string;
  type: 'contract' | 'image' | 'certificate' | 'invoice' | 'lease' | 'insurance' | 'other';
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  property_id?: string;
  type: 'lease_expiry' | 'rent_due' | 'maintenance' | 'document_upload' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface PropertyInvitation {
  id: string;
  email: string;
  property_ids: string[];
  invitation_token: string;
  invited_by: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface PropertyWithTenant extends DatabaseProperty {
  tenant?: Tenant;
  financial_summary?: {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    last_income_date?: string;
  };
}

export interface OwnerDashboardStats {
  total_properties: number;
  occupied_properties: number;
  vacant_properties: number;
  total_monthly_income: number;
  total_monthly_expenses: number;
  net_monthly_profit: number;
  properties_needing_attention: number;
}
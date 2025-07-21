
export interface Property {
  id: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  tenant: string;
  tenantPhone: string;
  additionalDetails: string;
  entryDate: string;
  status: 'occupied' | 'vacant' | 'pending';
  contractStatus: 'yearly' | 'two-year' | 'flexible' | 'custom';
  contractEndDate?: string;
  lastContactDate?: string;
  notes?: string;
  reminderStatus?: 'none' | 'two-months' | 'one-month' | 'two-weeks' | 'urgent';
}

export interface PropertyStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  pendingProperties: number;
  upcomingRenewals: number;
  urgentAlerts: number;
}

export interface Alert {
  id: string;
  propertyId: string;
  type: 'contract-renewal' | 'contact-needed' | 'vacant-property' | 'urgent';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  status: 'active' | 'handled' | 'snoozed';
}

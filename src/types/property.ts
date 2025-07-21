export interface Property {
  id: string;
  address: string;
  city: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  monthlyRent?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  status: 'occupied' | 'vacant' | 'maintenance';
}

export interface PropertyStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  upcomingRenewals: number;
}

export interface Alert {
  id: string;
  type: 'lease_expiry' | 'vacancy' | 'maintenance' | 'payment';
  priority: 'urgent' | 'high' | 'medium';
  message: string;
  propertyAddress: string;
  ownerName: string;
  tenantName?: string;
  dueDate?: string;
  createdAt: string;
}
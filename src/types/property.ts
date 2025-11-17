
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
  status: 'unknown' | 'occupied' | 'vacant' | 'maintenance';
  // Contact tracking fields
  contactStatus: 'not_contacted' | 'called_no_answer' | 'called_answered' | 'needs_callback';
  lastContactDate?: string;
  contactNotes?: string;
  contactAttempts: number;
  // New fields for enhanced property management
  propertySize?: number; // in square meters
  floor?: number;
  rooms?: number;
  bathrooms?: number;
  parking?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  yard?: boolean;
  balconyYardSize?: number;
  buildingFloors?: number;
  municipalTax?: number;
  buildingCommitteeFee?: number;
  showManagementBadge?: boolean;
  title?: string;
  description?: string;
  acquisitionCost?: number;
  renovationCosts?: number;
  currentMarketValue?: number;
  featured?: boolean;
  notes?: string;
  documents?: PropertyDocument[];
  images?: PropertyImage[];
  lastUpdated?: string;
  createdAt?: string;
  property_type?: 'rental' | 'sale' | 'management';
  assignedUserId?: string;
}

export interface PropertyImage {
  id: string;
  name: string;
  url: string; // Base64 encoded image data
  isPrimary: boolean;
  uploadedAt: string;
  size?: number;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: 'contract' | 'image' | 'certificate' | 'invoice' | 'other';
  url?: string;
  uploadedAt: string;
  size?: number;
}

export interface PropertyStats {
  totalProperties: number;
  contactedProperties: number;
  notContactedProperties: number;
  confirmedOccupied: number;
  confirmedVacant: number;
  unknownStatus: number;
  upcomingRenewals: number;
}

export interface Alert {
  id: string;
  type: 'lease_expiry' | 'vacancy' | 'maintenance' | 'payment';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  message: string;
  propertyAddress: string;
  ownerName: string;
  tenantName?: string;
  dueDate?: string;
  createdAt: string;
}

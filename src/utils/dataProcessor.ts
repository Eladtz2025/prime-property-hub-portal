
import { Property } from '../types/property';

export const fixPhoneNumber = (phone: string): string => {
  if (!phone || phone === 'nan' || phone === '—') return '';
  
  // Handle multiple phone numbers separated by " / "
  const phoneNumbers = phone.split(' / ').map(num => {
    const cleaned = num.trim().replace(/[^\d]/g, '');
    
    // If it's 8 digits (landline), add 0 at the beginning
    if (cleaned.length === 8) {
      return '0' + cleaned;
    }
    
    // If it's 9 digits (mobile without leading 0), add 0 at the beginning
    if (cleaned.length === 9) {
      return '0' + cleaned;
    }
    
    // If it's already 10 digits, return as is
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    // Return original if format is unclear
    return num.trim();
  });
  
  return phoneNumbers.join(' / ');
};

export const processPropertyData = (rawData: any[]): Property[] => {
  return rawData.map((item, index) => ({
    id: `property-${index + 1}`,
    address: item.address || '',
    ownerName: item.ownerName || '',
    ownerPhone: fixPhoneNumber(item.ownerPhone || ''),
    tenant: item.tenant === 'nan' ? '' : item.tenant || '',
    tenantPhone: fixPhoneNumber(item.tenantPhone || ''),
    additionalDetails: item.additionalDetails === '—' ? '' : item.additionalDetails || '',
    entryDate: item.entryDate === 'nan' ? '' : item.entryDate || '',
    status: item.tenant && item.tenant !== 'nan' ? 'occupied' : 'vacant',
    contractStatus: 'yearly', // Default value
    notes: '',
    reminderStatus: 'none'
  }));
};

export const calculatePropertyStats = (properties: Property[]): any => {
  const stats = {
    totalProperties: properties.length,
    occupiedProperties: properties.filter(p => p.status === 'occupied').length,
    vacantProperties: properties.filter(p => p.status === 'vacant').length,
    pendingProperties: properties.filter(p => p.status === 'pending').length,
    upcomingRenewals: 0,
    urgentAlerts: 0
  };

  // Calculate upcoming renewals and urgent alerts
  properties.forEach(property => {
    if (property.contractEndDate) {
      const endDate = new Date(property.contractEndDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
        stats.upcomingRenewals++;
      }
      
      if (daysUntilExpiry <= 14 && daysUntilExpiry > 0) {
        stats.urgentAlerts++;
      }
    }
  });

  return stats;
};

import { useState, useEffect, useMemo } from 'react';
import { useTenantData } from './useTenantData';
import { usePropertyData } from './usePropertyData';
import { formatPhoneForWhatsApp } from '../utils/whatsappHelper';

interface RelevantContact {
  phone: string;
  normalizedPhone: string;
  name: string;
  type: 'tenant' | 'owner';
  propertyAddress?: string;
  propertyId?: string;
}

export const useRelevantPhoneNumbers = () => {
  const { propertiesWithTenants } = useTenantData();
  const [ownerContacts, setOwnerContacts] = useState<RelevantContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load owner contacts from JSON file
  useEffect(() => {
    const loadOwnerContacts = async () => {
      try {
        const response = await fetch('/בעלי_דירות_מעודכן.json');
        const ownersData = await response.json();
        
        const contacts: RelevantContact[] = ownersData.map((owner: any) => ({
          phone: owner.טלפון,
          normalizedPhone: formatPhoneForWhatsApp(owner.טלפון),
          name: owner.שם,
          type: 'owner' as const,
          propertyAddress: owner.כתובת
        }));
        
        setOwnerContacts(contacts);
      } catch (error) {
        console.error('Error loading owner contacts:', error);
        setOwnerContacts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOwnerContacts();
  }, []);

  // Combine tenant and owner contacts
  const allRelevantContacts = useMemo(() => {
    const tenantContacts: RelevantContact[] = [];
    
    propertiesWithTenants.forEach(property => {
      property.tenants.forEach(tenant => {
        if (tenant.phone && tenant.phone.trim()) {
          tenantContacts.push({
            phone: tenant.phone,
            normalizedPhone: formatPhoneForWhatsApp(tenant.phone),
            name: tenant.name,
            type: 'tenant',
            propertyAddress: property.address,
            propertyId: property.id
          });
        }
      });
    });

    return [...tenantContacts, ...ownerContacts];
  }, [propertiesWithTenants, ownerContacts]);

  // Create a map for quick lookups
  const phoneMap = useMemo(() => {
    const map = new Map<string, RelevantContact>();
    allRelevantContacts.forEach(contact => {
      // Add both original and normalized phone numbers for lookup
      map.set(contact.normalizedPhone, contact);
      map.set(contact.phone, contact);
    });
    return map;
  }, [allRelevantContacts]);

  const isRelevantPhone = (phone: string) => {
    if (!phone) return false;
    const normalizedPhone = formatPhoneForWhatsApp(phone);
    return phoneMap.has(phone) || phoneMap.has(normalizedPhone);
  };

  const getContactInfo = (phone: string): RelevantContact | undefined => {
    if (!phone) return undefined;
    const normalizedPhone = formatPhoneForWhatsApp(phone);
    return phoneMap.get(phone) || phoneMap.get(normalizedPhone);
  };

  const addNewContact = (contact: Omit<RelevantContact, 'normalizedPhone'>) => {
    const newContact: RelevantContact = {
      ...contact,
      normalizedPhone: formatPhoneForWhatsApp(contact.phone)
    };

    if (contact.type === 'owner') {
      setOwnerContacts(prev => [...prev, newContact]);
    }
    // For tenants, they will be added through the tenant management system
  };

  return {
    allRelevantContacts,
    isRelevantPhone,
    getContactInfo,
    addNewContact,
    isLoading,
    tenantContacts: allRelevantContacts.filter(c => c.type === 'tenant'),
    ownerContacts: allRelevantContacts.filter(c => c.type === 'owner')
  };
};
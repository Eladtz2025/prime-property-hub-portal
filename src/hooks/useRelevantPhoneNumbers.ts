import { useState, useEffect, useMemo } from 'react';
import { useTenantData } from './useTenantData';
import { usePropertyData } from './usePropertyData';
import { formatPhoneForWhatsApp } from '../utils/whatsappHelper';
import { supabase } from '@/integrations/supabase/client';
import { loadPropertiesFromStorage } from '../utils/propertyStorage';

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

  // Load owner contacts from JSON file, database, and localStorage
  useEffect(() => {
    const loadOwnerContacts = async () => {
      try {
        const contacts: RelevantContact[] = [];
        
        // Load from static JSON file
        try {
          const response = await fetch('/כל הנכסים - JSON ל-AI.json');
          const ownersData = await response.json();
          
          const jsonContacts: RelevantContact[] = ownersData
            .filter((owner: any) => {
              const phone = owner.owner_phone;
              if (!phone) return false;
              
              // Handle phone numbers that might be numbers or strings with slashes
              const phoneStr = phone.toString().trim();
              if (!phoneStr) return false;
              
              // Skip entries with slashes or multiple numbers for now
              if (phoneStr.includes('/')) return false;
              
              return phoneStr.replace(/\D/g, '').length >= 9; // At least 9 digits
            })
            .map((owner: any) => ({
              phone: owner.owner_phone.toString(),
              normalizedPhone: formatPhoneForWhatsApp(owner.owner_phone.toString()),
              name: owner.owner_name || 'בעל נכס',
              type: 'owner' as const,
              propertyAddress: owner.address
            }));
          
          contacts.push(...jsonContacts);
          console.log('[WhatsApp Debug] Loaded from JSON:', jsonContacts.length, 'contacts');
        } catch (jsonError) {
          console.error('Error loading JSON owner contacts:', jsonError);
        }
        
        // Load from localStorage (newly added properties)
        try {
          const storedProperties = loadPropertiesFromStorage();
          const localStorageContacts: RelevantContact[] = Object.values(storedProperties)
            .filter(property => property.ownerPhone && property.ownerPhone.trim() && property.ownerName)
            .map(property => ({
              phone: property.ownerPhone!,
              normalizedPhone: formatPhoneForWhatsApp(property.ownerPhone!),
              name: property.ownerName || 'בעל נכס',
              type: 'owner' as const,
              propertyAddress: property.address,
              propertyId: property.id
            }));
          
          contacts.push(...localStorageContacts);
          console.log('[WhatsApp Debug] Loaded from localStorage:', localStorageContacts.length, 'contacts');
          console.log('[WhatsApp Debug] localStorage contacts:', localStorageContacts);
        } catch (storageError) {
          console.error('Error loading localStorage owner contacts:', storageError);
        }
        
        // Load from database
        try {
          const { data: dbOwners, error } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              phone,
              property_owners!inner (
                property_id,
                properties!inner (
                  address,
                  city
                )
              )
            `)
            .not('phone', 'is', null)
            .neq('phone', '');
          
          if (error) throw error;
          
          const dbContacts: RelevantContact[] = dbOwners
            .filter(owner => owner.phone && owner.phone.trim())
            .map(owner => ({
              phone: owner.phone!,
              normalizedPhone: formatPhoneForWhatsApp(owner.phone!),
              name: owner.full_name || 'בעל נכס',
              type: 'owner' as const,
              propertyAddress: owner.property_owners?.[0]?.properties?.address 
                ? `${owner.property_owners[0].properties.address}, ${owner.property_owners[0].properties.city}`
                : undefined
            }));
          
          contacts.push(...dbContacts);
          console.log('[WhatsApp Debug] Loaded from database:', dbContacts.length, 'contacts');
        } catch (dbError) {
          console.error('Error loading database owner contacts:', dbError);
        }
        
        console.log('[WhatsApp Debug] Total owner contacts loaded:', contacts.length);
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

    const combined = [...tenantContacts, ...ownerContacts];
    console.log('[WhatsApp Debug] All relevant contacts:', combined.length);
    console.log('[WhatsApp Debug] Contact names:', combined.map(c => c.name));
    return combined;
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
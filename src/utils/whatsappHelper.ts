
import { Property } from '../types/property';
import { supabase } from '@/integrations/supabase/client';

export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 972
  if (cleanPhone.startsWith('0')) {
    return '972' + cleanPhone.substring(1);
  }
  
  // If doesn't start with 972, add it
  if (!cleanPhone.startsWith('972')) {
    return '972' + cleanPhone;
  }
  
  return cleanPhone;
};

export const openWhatsApp = (phone: string, message?: string) => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  const whatsappUrl = `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
  window.open(whatsappUrl, '_blank');
};

export const replaceMessageVariables = (message: string, property: Property): string => {
  return message
    .replace(/{שם}/g, property.ownerName)
    .replace(/{כתובת}/g, property.address)
    .replace(/{חוזה}/g, property.leaseEndDate ? new Date(property.leaseEndDate).toLocaleDateString('he-IL') : 'לא מוגדר');
};

export const getPropertiesWithPhones = (properties: Property[]): Property[] => {
  return properties.filter(property => property.ownerPhone && property.ownerPhone.trim() !== '');
};

export const sendWhatsAppMessage = async (phone: string, message: string, propertyId?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: {
        phone,
        message,
        propertyId
      }
    });

    if (error) {
      console.error('WhatsApp send error:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      console.error('WhatsApp API error:', data.error);
      return { success: false, error: data.error };
    }

    console.log('WhatsApp message sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

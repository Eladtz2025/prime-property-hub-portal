import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phone_2: string | null;
  message: string;
  property_id: string | null;
  created_at: string;
  budget_min: number | null;
  budget_max: number | null;
  rooms_min: number | null;
  rooms_max: number | null;
  size_min: number | null;
  size_max: number | null;
  preferred_cities: string[] | null;
  preferred_neighborhoods: string[] | null;
  property_type: string | null;
  move_in_date: string | null;
  immediate_entry: boolean | null;
  status: string;
  priority: string;
  assigned_agent_id: string | null;
  notes: string | null;
  last_contact_date: string | null;
  next_followup_date: string | null;
  source: string;
  updated_at: string | null;
  is_hidden: boolean | null;
  // Rental-specific fields
  pets: boolean | null;
  tenant_type: string | null;
  flexible_move_date: boolean | null;
  parking_required: boolean | null;
  balcony_required: boolean | null;
  elevator_required: boolean | null;
  // Yard requirement
  yard_required: boolean | null;
  // Flexibility flags for features
  elevator_flexible: boolean | null;
  parking_flexible: boolean | null;
  balcony_flexible: boolean | null;
  yard_flexible: boolean | null;
  // Roof and outdoor space options
  roof_required: boolean | null;
  roof_flexible: boolean | null;
  outdoor_space_any: boolean | null;
  // Pets flexibility
  pets_flexible: boolean | null;
  // New fields: mamad and furnished
  mamad_required: boolean | null;
  mamad_flexible: boolean | null;
  furnished_required: string | null;
  furnished_flexible: boolean | null;
  // Purchase-specific fields
  purchase_purpose: string | null;
  cash_available: number | null;
  property_to_sell: boolean | null;
  lawyer_details: string | null;
  urgency_level: string | null;
  renovation_budget: number | null;
  new_or_second_hand: string | null;
  floor_preference: string | null;
  view_preference: string | null;
  // Eligibility fields from DB trigger
  matching_status: string | null;
  eligibility_reason: string | null;
  rejection_summary: {
    total_rejected: number;
    reasons: Record<string, number>;
  } | null;
}

export interface PropertyInterest {
  id: string;
  lead_id: string;
  property_id: string;
  interest_level: string;
  notes: string | null;
  contacted_at: string | null;
  viewed_at: string | null;
  created_at: string;
  property?: {
    title: string;
    address: string;
    monthly_rent: number;
  };
}

interface CustomerFilters {
  status?: string;
  priority?: string;
  assigned_agent_id?: string;
  search?: string;
  showHidden?: boolean;
  onlyHidden?: boolean;
}

export const useCustomerData = (filters?: CustomerFilters) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('contact_leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter hidden customers
      if (filters?.onlyHidden) {
        query = query.eq('is_hidden', true);
      } else if (!filters?.showHidden) {
        query = query.or('is_hidden.is.null,is_hidden.eq.false');
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_agent_id) {
        query = query.eq('assigned_agent_id', filters.assigned_agent_id);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      logger.error('Error fetching customers', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת הלקוחות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filters?.status, filters?.priority, filters?.assigned_agent_id, filters?.search, filters?.showHidden, filters?.onlyHidden]);

  const updateCustomerStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .update({ 
          status,
          last_contact_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'עודכן בהצלחה',
        description: 'סטטוס הלקוח עודכן',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error updating customer status', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את הסטטוס',
        variant: 'destructive',
      });
    }
  };

  const updateCustomerPriority = async (id: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .update({ priority })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'עודכן בהצלחה',
        description: 'עדיפות הלקוח עודכנה',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error updating customer priority', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את העדיפות',
        variant: 'destructive',
      });
    }
  };

  const assignAgent = async (id: string, agentId: string | null) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .update({ assigned_agent_id: agentId })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'עודכן בהצלחה',
        description: 'הסוכן הוקצה ללקוח',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error assigning agent', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להקצות סוכן',
        variant: 'destructive',
      });
    }
  };

  const scheduleFollowup = async (id: string, date: string) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .update({ next_followup_date: date })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'עודכן בהצלחה',
        description: 'תאריך המעקב נשמר',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error scheduling followup', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לתזמן מעקב',
        variant: 'destructive',
      });
    }
  };

  const addNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'עודכן בהצלחה',
        description: 'הערות נשמרו',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error adding notes', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור הערות',
        variant: 'destructive',
      });
    }
  };

  const addPropertyInterest = async (leadId: string, propertyId: string, interestLevel: string = 'interested') => {
    try {
      const { error } = await supabase
        .from('property_interests')
        .insert({
          lead_id: leadId,
          property_id: propertyId,
          interest_level: interestLevel,
        });

      if (error) throw error;
      
      toast({
        title: 'נוסף בהצלחה',
        description: 'התעניינות בנכס נרשמה',
      });
    } catch (error) {
      logger.error('Error adding property interest', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לרשום התעניינות',
        variant: 'destructive',
      });
    }
  };

  const fetchPropertyInterests = async (leadId: string): Promise<PropertyInterest[]> => {
    try {
      const { data, error } = await supabase
        .from('property_interests')
        .select(`
          *,
          property:properties(title, address, monthly_rent)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching property interests', error, 'useCustomerData');
      return [];
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'נמחק בהצלחה',
        description: 'הלקוח נמחק לצמיתות',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error deleting customer', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את הלקוח',
        variant: 'destructive',
      });
    }
  };

  const hideCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .update({ is_hidden: true })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'סומן כלא רלוונטי',
        description: 'הלקוח הוסתר מהרשימה',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error hiding customer', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להסתיר את הלקוח',
        variant: 'destructive',
      });
    }
  };

  const unhideCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_leads')
        .update({ is_hidden: false })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'שוחזר בהצלחה',
        description: 'הלקוח שוחזר לרשימה',
      });
      
      fetchCustomers();
    } catch (error) {
      logger.error('Error unhiding customer', error, 'useCustomerData');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשחזר את הלקוח',
        variant: 'destructive',
      });
    }
  };

  return {
    customers,
    loading,
    fetchCustomers,
    updateCustomerStatus,
    updateCustomerPriority,
    assignAgent,
    scheduleFollowup,
    addNotes,
    addPropertyInterest,
    fetchPropertyInterests,
    deleteCustomer,
    hideCustomer,
    unhideCustomer,
  };
};

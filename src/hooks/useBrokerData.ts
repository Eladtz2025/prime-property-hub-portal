import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

export interface Broker {
  id: string;
  name: string;
  phone: string;
  office_name: string | null;
  interested_properties: string[];
  interested_properties_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrokerWithPropertyNames extends Broker {
  property_names: string[];
}

export interface CreateBrokerData {
  name: string;
  phone: string;
  office_name?: string;
  interested_properties?: string[];
  interested_properties_text?: string;
  notes?: string;
}

export function useBrokerData() {
  const [brokers, setBrokers] = useState<BrokerWithPropertyNames[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('*')
        .order('created_at', { ascending: false });

      if (brokersError) throw brokersError;

      // Fetch property names for all interested properties
      const allPropertyIds = (brokersData || []).flatMap(b => b.interested_properties || []);
      const uniquePropertyIds = [...new Set(allPropertyIds)];

      let propertyMap: Record<string, string> = {};
      if (uniquePropertyIds.length > 0) {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('id, title, address')
          .in('id', uniquePropertyIds);

        if (propertiesData) {
          propertyMap = propertiesData.reduce((acc, p) => {
            acc[p.id] = p.title || p.address;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const brokersWithNames: BrokerWithPropertyNames[] = (brokersData || []).map(broker => ({
        ...broker,
        interested_properties: broker.interested_properties || [],
        property_names: (broker.interested_properties || []).map(id => propertyMap[id] || 'נכס לא נמצא'),
      }));

      setBrokers(brokersWithNames);
    } catch (error) {
      logger.error('Error fetching brokers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  const createBroker = async (data: CreateBrokerData) => {
    const { error } = await supabase
      .from('brokers')
      .insert({
        name: data.name,
        phone: data.phone,
        office_name: data.office_name || null,
        interested_properties: data.interested_properties || [],
        interested_properties_text: data.interested_properties_text || null,
        notes: data.notes || null,
      });

    if (error) throw error;
    await fetchBrokers();
  };

  const updateBroker = async (id: string, data: Partial<CreateBrokerData>) => {
    const { error } = await supabase
      .from('brokers')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await fetchBrokers();
  };

  const deleteBroker = async (id: string) => {
    const { error } = await supabase
      .from('brokers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchBrokers();
  };

  return {
    brokers,
    loading,
    fetchBrokers,
    createBroker,
    updateBroker,
    deleteBroker,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScoutSettingRow {
  id: string;
  category: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ScoutSettings {
  duplicates: {
    price_diff_threshold: number;
    size_diff_threshold: number;
    require_same_floor: boolean;
    auto_create_alerts: boolean;
    min_price_diff_for_alert: number;
  };
  matching: {
    min_score: number;
    max_matches_per_property: number;
    flexible_price_threshold: number;
    auto_send_whatsapp: boolean;
  };
  scraping: {
    yad2_pages: number;
    madlan_pages: number;
    homeless_pages: number;
    delay_between_requests_ms: number;
    madlan_delay_ms: number;
    stuck_timeout_minutes: number;
    max_properties_per_config: number;
  };
}

// Default values
export const defaultSettings: ScoutSettings = {
  duplicates: {
    price_diff_threshold: 0.20,
    size_diff_threshold: 0.10,
    require_same_floor: false,
    auto_create_alerts: true,
    min_price_diff_for_alert: 5,
  },
  matching: {
    min_score: 60,
    max_matches_per_property: 20,
    flexible_price_threshold: 0.15,
    auto_send_whatsapp: false,
  },
  scraping: {
    yad2_pages: 7,
    madlan_pages: 4,
    homeless_pages: 0,
    delay_between_requests_ms: 1500,
    madlan_delay_ms: 5000,
    stuck_timeout_minutes: 30,
    max_properties_per_config: 500,
  },
};

function parseSettingValue(value: any, defaultValue: any): any {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === typeof defaultValue) {
    return value;
  }
  
  if (typeof defaultValue === 'number' && typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  if (typeof defaultValue === 'boolean' && typeof value === 'string') {
    return value === 'true' || value === '1';
  }
  
  return value;
}

export function useScoutSettings(category?: keyof ScoutSettings) {
  return useQuery({
    queryKey: ['scout-settings', category],
    queryFn: async (): Promise<ScoutSettings> => {
      let query = supabase.from('scout_settings').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to fetch scout settings:', error);
        return defaultSettings;
      }
      
      // Start with defaults
      const settings: ScoutSettings = JSON.parse(JSON.stringify(defaultSettings));
      
      // Override with database values
      for (const row of data || []) {
        const { category: cat, setting_key, setting_value } = row;
        
        if (cat === 'duplicates' && setting_key in settings.duplicates) {
          const key = setting_key as keyof typeof settings.duplicates;
          (settings.duplicates as any)[key] = parseSettingValue(setting_value, defaultSettings.duplicates[key]);
        } else if (cat === 'matching' && setting_key in settings.matching) {
          const key = setting_key as keyof typeof settings.matching;
          (settings.matching as any)[key] = parseSettingValue(setting_value, defaultSettings.matching[key]);
        } else if (cat === 'scraping' && setting_key in settings.scraping) {
          const key = setting_key as keyof typeof settings.scraping;
          (settings.scraping as any)[key] = parseSettingValue(setting_value, defaultSettings.scraping[key]);
        }
      }
      
      return settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useScoutSettingsRaw() {
  return useQuery({
    queryKey: ['scout-settings-raw'],
    queryFn: async (): Promise<ScoutSettingRow[]> => {
      const { data, error } = await supabase
        .from('scout_settings')
        .select('*')
        .order('category')
        .order('setting_key');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },
  });
}

export function useUpdateScoutSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      category, 
      setting_key, 
      setting_value 
    }: { 
      category: string; 
      setting_key: string; 
      setting_value: any;
    }) => {
      const { error } = await supabase
        .from('scout_settings')
        .update({ setting_value })
        .eq('category', category)
        .eq('setting_key', setting_key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-settings'] });
      queryClient.invalidateQueries({ queryKey: ['scout-settings-raw'] });
      toast.success('ההגדרה עודכנה בהצלחה');
    },
    onError: (error) => {
      console.error('Failed to update setting:', error);
      toast.error('שגיאה בעדכון ההגדרה');
    },
  });
}

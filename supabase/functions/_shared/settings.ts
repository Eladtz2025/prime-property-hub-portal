// Shared settings utilities for Edge Functions
// Fetches configurable settings from the scout_settings table

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface ScoutSettings {
  duplicates: {
    price_diff_threshold: number;
    size_diff_threshold: number;
    require_same_floor: boolean;
    auto_create_alerts: boolean;
    min_price_diff_for_alert: number;
    schedule_end_time: string;
  };
  matching: {
    min_score: number;
    max_matches_per_property: number;
    flexible_price_threshold: number;
    entry_date_range_strict: number;
    entry_date_range_flexible: number;
    immediate_max_days: number;
    // Dynamic price flexibility settings
    rent_flex_low_threshold: number;
    rent_flex_low_percent: number;
    rent_flex_mid_threshold: number;
    rent_flex_mid_percent: number;
    rent_flex_high_percent: number;
    // Schedule settings
    schedule_times: string[];
    schedule_end_time: string;
  };
  scraping: {
    yad2_pages: number;
    madlan_pages: number;
    homeless_pages: number;
    stuck_timeout_minutes: number;
    max_properties_per_config: number;
  };
  availability: {
    min_days_before_check: number;
    batch_size: number;
    delay_between_batches_ms: number;
    delay_between_requests_ms: number;
    head_timeout_ms: number;
    get_timeout_ms: number;
    daily_limit: number;
    recheck_interval_days: number;
    first_recheck_interval_days: number;
    recurring_recheck_interval_days: number;
    concurrency_limit: number;
    per_property_timeout_ms: number;
    schedule_end_time: string;
  };
  backfill: {
    schedule_end_time: string;
  };
}

// Default values matching the database defaults
export const defaultSettings: ScoutSettings = {
  duplicates: {
    price_diff_threshold: 0.20,
    size_diff_threshold: 0.10,
    require_same_floor: false,
    auto_create_alerts: true,
    min_price_diff_for_alert: 5,
    schedule_end_time: '04:30',
  },
  matching: {
    min_score: 60,
    max_matches_per_property: 20,
    flexible_price_threshold: 0.15,
    auto_send_whatsapp: false,
    entry_date_range_strict: 10,
    entry_date_range_flexible: 14,
    immediate_max_days: 30,
    rent_flex_low_threshold: 7000,
    rent_flex_low_percent: 0.07,
    rent_flex_mid_threshold: 15000,
    rent_flex_mid_percent: 0.05,
    rent_flex_high_percent: 0.03,
    schedule_times: ['07:00'],
    schedule_end_time: '08:30',
  },
  scraping: {
    yad2_pages: 7,
    madlan_pages: 4,
    homeless_pages: 0,
    stuck_timeout_minutes: 30,
    max_properties_per_config: 500,
  },
  availability: {
    min_days_before_check: 2,
    batch_size: 25,
    delay_between_batches_ms: 1000,
    delay_between_requests_ms: 300,
    head_timeout_ms: 10000,
    get_timeout_ms: 8000,
    daily_limit: 1200,
    recheck_interval_days: 7,
    first_recheck_interval_days: 8,
    recurring_recheck_interval_days: 2,
    concurrency_limit: 4,
    per_property_timeout_ms: 25000,
    schedule_end_time: '06:30',
  },
  backfill: {
    schedule_end_time: '02:30',
  },
};

/**
 * Parse a JSONB setting value to the expected type
 */
function parseSettingValue(value: any, defaultValue: any): any {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // If it's already the right type, return it
  if (typeof value === typeof defaultValue) {
    return value;
  }
  
  // Handle string to array conversion (JSON parsing)
  if (Array.isArray(defaultValue) && typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  
  // Handle string to number conversion
  if (typeof defaultValue === 'number' && typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  // Handle string to boolean conversion
  if (typeof defaultValue === 'boolean' && typeof value === 'string') {
    return value === 'true' || value === '1';
  }
  
  return value;
}

/**
 * Fetch all scout settings from the database
 */
export async function fetchScoutSettings(
  supabase: ReturnType<typeof createClient>
): Promise<ScoutSettings> {
  const { data, error } = await supabase
    .from('scout_settings')
    .select('category, setting_key, setting_value');
  
  if (error) {
    console.warn('Failed to fetch scout settings, using defaults:', error);
    return defaultSettings;
  }
  
  // Start with defaults
  const settings: ScoutSettings = JSON.parse(JSON.stringify(defaultSettings));
  
  // Override with database values
  for (const row of data || []) {
    const { category, setting_key, setting_value } = row;
    
    if (category === 'duplicates' && setting_key in settings.duplicates) {
      const key = setting_key as keyof typeof settings.duplicates;
      (settings.duplicates as any)[key] = parseSettingValue(setting_value, defaultSettings.duplicates[key]);
    } else if (category === 'matching' && setting_key in settings.matching) {
      const key = setting_key as keyof typeof settings.matching;
      (settings.matching as any)[key] = parseSettingValue(setting_value, defaultSettings.matching[key]);
    } else if (category === 'scraping' && setting_key in settings.scraping) {
      const key = setting_key as keyof typeof settings.scraping;
      (settings.scraping as any)[key] = parseSettingValue(setting_value, defaultSettings.scraping[key]);
    } else if (category === 'availability' && setting_key in settings.availability) {
      const key = setting_key as keyof typeof settings.availability;
      (settings.availability as any)[key] = parseSettingValue(setting_value, defaultSettings.availability[key]);
    } else if (category === 'backfill' && setting_key in settings.backfill) {
      const key = setting_key as keyof typeof settings.backfill;
      (settings.backfill as any)[key] = parseSettingValue(setting_value, defaultSettings.backfill[key]);
    }
  }
  
  return settings;
}

/**
 * Fetch settings for a specific category
 */
export async function fetchCategorySettings<T extends keyof ScoutSettings>(
  supabase: ReturnType<typeof createClient>,
  category: T
): Promise<ScoutSettings[T]> {
  const { data, error } = await supabase
    .from('scout_settings')
    .select('setting_key, setting_value')
    .eq('category', category);
  
  if (error) {
    console.warn(`Failed to fetch ${category} settings, using defaults:`, error);
    return defaultSettings[category];
  }
  
  // Start with defaults for this category
  const settings = JSON.parse(JSON.stringify(defaultSettings[category]));
  
  // Override with database values
  for (const row of data || []) {
    const { setting_key, setting_value } = row;
    if (setting_key in settings) {
      (settings as any)[setting_key] = parseSettingValue(setting_value, (defaultSettings[category] as any)[setting_key]);
    }
  }
  
  return settings;
}

/**
 * Check if the current time (in Israel) has passed the given end time.
 * Uses dynamic timezone to handle DST automatically.
 * 
 * @param endTimeIL - End time in Israel timezone, format "HH:MM" (e.g. "06:30")
 * @returns true if the current Israel time is past the end time
 */
export function isPastEndTime(endTimeIL: string): boolean {
  if (!endTimeIL) return false;
  
  const [endH, endM] = endTimeIL.split(':').map(Number);
  if (isNaN(endH) || isNaN(endM)) return false;
  
  const now = new Date();
  const israelTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
  const israelNow = new Date(israelTimeStr);
  const israelHour = israelNow.getHours();
  const israelMinute = israelNow.getMinutes();
  
  const currentMinutes = israelHour * 60 + israelMinute;
  const endMinutes = endH * 60 + endM;
  
  return currentMinutes >= endMinutes;
}

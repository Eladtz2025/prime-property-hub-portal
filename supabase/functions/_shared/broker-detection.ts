// Shared broker detection utilities for Edge Functions
// Extracted from scout-properties for better maintainability

/**
 * Broker keywords for detection
 */
export const brokerKeywords = [
  'תיווך', 'נדל"ן', 'נדלן', 'סוכנות', 'משרד',
  'רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21', 'century21',
  'קולדוול בנקר', 'coldwell', 'מתווך', 'מתווכת', 'agency', 'real estate',
  'נכסים', 'ריאלטי', 'realty', 'קבוצת', 'group', 'אחוזות',
  'רישיון', 'license', 'יועץ נדלן', 'סוכן נדלן', 'broker'
];

/**
 * Detect broker from title/description keywords and raw data
 * Returns true if the property appears to be listed by a broker
 */
export function detectBroker(title: string, description: string, rawData?: Record<string, unknown>): boolean {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  // Check 1: Broker keywords in text
  if (brokerKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
    return true;
  }
  
  // Check 2: 7-digit brokerage license number pattern
  const licensePattern = /\b\d{7}\b/;
  if (licensePattern.test(text)) {
    return true;
  }
  
  // Check 3: rawData fields (for Madlan properties)
  if (rawData) {
    const contactName = String(rawData.contactName || rawData.advertiserName || rawData.contact_name || '').toLowerCase();
    const advertiserType = String(rawData.advertiserType || rawData.advertiser_type || '').toLowerCase();
    
    // Check broker keywords in contact/advertiser name
    if (brokerKeywords.some(k => contactName.includes(k.toLowerCase()))) {
      return true;
    }
    
    // Check advertiser type
    if (advertiserType === 'תיווך' || advertiserType === 'broker' || advertiserType === 'agency') {
      return true;
    }
    
    // Check if rawData has explicit broker flag
    if (rawData.isBroker === true || rawData.is_broker === true) {
      return true;
    }
    
    // Check 4: Madlan-specific - rawData.description field contains broker indicator
    const rawDescription = String(rawData.description || '').toLowerCase();
    if (rawDescription === 'תיווך' || rawDescription.includes('מתיווך') || rawDescription.includes('תיווך')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Normalize city names for consistent storage
 */
export function normalizeCityName(city: string | undefined): string | undefined {
  if (!city) return city;
  
  const cityLower = city.trim();
  
  // Normalize Tel Aviv variations to standard format
  if (cityLower.includes('תל אביב') || cityLower.includes('תל-אביב')) {
    return 'תל אביב יפו';
  }
  
  return city.trim();
}

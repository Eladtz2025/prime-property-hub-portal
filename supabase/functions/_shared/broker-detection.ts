// Shared broker detection utilities for Edge Functions
// Canonical source for broker/private classification logic

// ============================================
// Address Validation Utilities
// ============================================

/**
 * Broker/agency names that should NOT appear in address fields
 * These are known brokerage firms that sometimes get scraped as addresses
 */
const ADDRESS_BLACKLIST_PATTERNS = [
  // Hebrew broker names
  /קונקורד/i,
  /מונרוב/i,
  /זירו\s*(מתווכים|תיווך)?/i,
  /הומי\s*(נדלן)?/i,
  /פאר\s*תיווך/i,
  /טל\s*נכסים/i,
  /חברה\s*חדשה/i,
  /rs\s*נדל/i,
  /אנגלו\s*סכסון/i,
  /רימקס/i,
  /קולדוול/i,
  // English broker names
  /concord/i,
  /monrov/i,
  /zero\s*broker/i,
  /homy/i,
  /anglo\s*saxon/i,
  /remax/i,
  /re\/max/i,
  /century\s*21?/i,
  /coldwell/i,
  // Property type keywords (not valid addresses)
  /^גג\/?$/,
  /^דירה$/,
  /^פנטהאוז$/,
  /^סטודיו$/,
];

/**
 * Check if an address contains broker/agency names (invalid address)
 * Returns true if the address is invalid and should be rejected
 */
export function isInvalidAddress(address: string | undefined | null): boolean {
  if (!address) return false;
  
  const addressLower = address.trim();
  return ADDRESS_BLACKLIST_PATTERNS.some(pattern => pattern.test(addressLower));
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

// ============================================
// Deep Broker Detection (from Firecrawl markdown)
// ============================================

/**
 * Detect broker/private from individual property page markdown.
 * Uses source-specific logic with careful regex to avoid phone number false positives.
 * 
 * Returns:
 *   true  = Private (strong evidence)
 *   false = Broker (strong evidence)
 *   null  = Can't determine (no clear indicator)
 */
export function detectBrokerFromMarkdown(markdown: string, source: string): boolean | null {
  if (!markdown) return null;
  
  const textLower = markdown.toLowerCase();
  
  // === Source-specific logic ===
  
  // MADLAN: Check individual property page for broker info
  if (source === 'madlan') {
    // Look for "מתיווך" (from broker) - appears on property page
    const hasMativauch = /מתיווך/.test(markdown);
    // Look for license number with context (not plain 7 digits which catches phones)
    const hasLicenseWithContext = /(?:רישיון|ר\.?ת\.?|תיווך)\s*:?\s*\d{7,8}/.test(markdown);
    const hasAgencyName = /שם הסוכנות/.test(markdown);
    
    if (hasMativauch || hasLicenseWithContext || hasAgencyName) {
      console.log(`🔍 Madlan broker: mativauch=${hasMativauch}, license=${hasLicenseWithContext}, agency=${hasAgencyName}`);
      return false; // Broker
    }
    
    // Check for explicit private indicators
    const isExplicitlyPrivate = /ללא\s*(ה)?תיווך|לא\s*למתווכים|ללא\s*מתווכים/i.test(markdown);
    if (isExplicitlyPrivate) {
      console.log(`🔍 Madlan explicit private indicator found`);
      return true; // Private
    }
    
    return null; // Can't determine from markdown
  }
  
  // YAD2: Check for explicit labels and license info
  if (source === 'yad2') {
    // === STEP 1: EXPLICIT LABELS (appear near price on Yad2 pages) ===
    // These are the most reliable indicators - red labels on the page
    
    // Private indicators (explicit labels)
    if (/מפרטי/.test(markdown)) {
      console.log('[yad2] classified private: keyword מפרטי');
      return true; // Private
    }
    if (/ללא\s*תיווך/.test(markdown)) {
      console.log('[yad2] classified private: keyword ללא תיווך');
      return true; // Private
    }
    if (/לא\s*למתווכים/.test(markdown)) {
      console.log('[yad2] classified private: keyword לא למתווכים');
      return true; // Private
    }
    if (/בעל\s*הדירה/.test(markdown)) {
      console.log('[yad2] classified private: keyword בעל הדירה');
      return true; // Private
    }
    
    // Broker indicators (explicit labels)
    if (/מתיווך/.test(markdown)) {
      console.log('[yad2] classified broker: keyword מתיווך');
      return false; // Broker
    }
    if (/משרד\s*תיווך/.test(markdown)) {
      console.log('[yad2] classified broker: keyword משרד תיווך');
      return false; // Broker
    }
    if (/מתווכ/.test(markdown)) {
      console.log('[yad2] classified broker: keyword מתווכ*');
      return false; // Broker
    }
    
    // === STEP 2: FALLBACK - License/brand checks ===
    const hasTivuchWithLicense = /תיווך:?\s*\d{7}/.test(markdown);
    const hasExplicitLicense = /(?:רישיון|ר\.?ת\.?)\s*:?\s*\d{7}/.test(markdown);
    const hasExclusivity = /בבלעדיות/.test(markdown);
    
    // Known broker brands
    const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21', 'קולדוול'];
    const hasBrokerBrand = BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()));
    
    if (hasTivuchWithLicense || hasExplicitLicense || hasExclusivity || hasBrokerBrand) {
      console.log(`[yad2] classified broker: tivuch+license=${hasTivuchWithLicense}, license=${hasExplicitLicense}, exclusivity=${hasExclusivity}, brand=${hasBrokerBrand}`);
      return false; // Broker
    }
    
    // === STEP 3: NO CLEAR INDICATOR - DON'T GUESS ===
    console.log('[yad2] no clear indicator found, returning null');
    return null; // Can't determine - don't guess
  }
  
  // HOMELESS: Check for agency/agent name
  if (source === 'homeless') {
    const hasAgencyName = /שם הסוכנות/.test(markdown);
    const hasAgentName = /שם הסוכן/.test(markdown);
    
    if (hasAgencyName || hasAgentName) {
      console.log(`[homeless] classified broker: agency=${hasAgencyName}, agent=${hasAgentName}`);
      return false; // Broker
    }
    
    // No clear indicator - don't guess
    console.log('[homeless] no clear indicator found, returning null');
    return null; // Can't determine - don't guess
  }
  
  // Fallback for unknown sources: check for generic broker indicators
  const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21', 'קולדוול'];
  const hasBrokerBrand = BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()));
  
  if (hasBrokerBrand) {
    console.log(`🔍 Generic broker brand found`);
    return false; // Broker
  }
  
  return null; // Can't determine
}

/**
 * Extract the evidence snippet that triggered the classification.
 * Used by reclassify-broker audit mode to show what matched.
 */
export function extractEvidenceSnippet(markdown: string, _source: string): string | null {
  if (!markdown) return null;
  
  const patterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /מתיווך/, label: 'מתיווך' },
    { regex: /(?:רישיון|ר\.?ת\.?|תיווך)\s*:?\s*\d{7,8}/, label: 'license' },
    { regex: /שם הסוכנות/, label: 'שם הסוכנות' },
    { regex: /ללא\s*(ה)?תיווך/, label: 'ללא תיווך' },
    { regex: /לא\s*למתווכים/, label: 'לא למתווכים' },
    { regex: /ללא\s*מתווכים/, label: 'ללא מתווכים' },
    { regex: /מפרטי/, label: 'מפרטי' },
    { regex: /בעל\s*הדירה/, label: 'בעל הדירה' },
    { regex: /משרד\s*תיווך/, label: 'משרד תיווך' },
    { regex: /מתווכ/, label: 'מתווכ*' },
    { regex: /בבלעדיות/, label: 'בבלעדיות' },
    { regex: /רימקס|re\/max|remax/i, label: 'brand:remax' },
    { regex: /אנגלו\s*סכסון/i, label: 'brand:anglo-saxon' },
    { regex: /century\s*21/i, label: 'brand:century21' },
    { regex: /קולדוול/i, label: 'brand:coldwell' },
    { regex: /שם הסוכן/, label: 'שם הסוכן' },
  ];
  
  for (const { regex, label } of patterns) {
    const match = markdown.match(regex);
    if (match) {
      const idx = match.index || 0;
      const start = Math.max(0, idx - 30);
      const end = Math.min(markdown.length, idx + match[0].length + 30);
      const context = markdown.substring(start, end).replace(/\n/g, ' ').trim();
      return `[${label}] ...${context}...`;
    }
  }
  
  return null;
}

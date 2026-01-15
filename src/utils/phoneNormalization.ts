/**
 * Normalize phone number for database comparison
 * Converts various formats to a standard 10-digit Israeli format (05XXXXXXXX)
 * 
 * Examples:
 * - "+972 54-562-1350" -> "0545621350"
 * - "972545621350" -> "0545621350"
 * - "054-562-1350" -> "0545621350"
 * - "0545621350" -> "0545621350"
 */
export const normalizePhoneForComparison = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Convert 972XXXXXXXXX to 05XXXXXXXX (Israeli international format)
  if (digits.startsWith('972') && digits.length >= 12) {
    return '0' + digits.substring(3);
  }
  
  // If starts with 5 and is 9 digits, add leading 0
  if (digits.startsWith('5') && digits.length === 9) {
    return '0' + digits;
  }
  
  return digits;
};

/**
 * Get the last N digits of a phone number for flexible matching
 * This helps match phones regardless of country code format
 */
export const getPhoneSuffix = (phone: string | null | undefined, digits: number = 9): string => {
  const normalized = normalizePhoneForComparison(phone);
  return normalized.slice(-digits);
};

/**
 * Generate phone variations for database search
 * Returns array of possible formats to search for
 */
export const getPhoneSearchVariations = (phone: string): string[] => {
  const normalized = normalizePhoneForComparison(phone);
  if (!normalized || normalized.length < 9) return [phone];
  
  const suffix = normalized.slice(-9); // Last 9 digits (without leading 0)
  
  return [
    normalized,                    // 0545621350
    '972' + suffix,                // 972545621350
    '+972' + suffix,               // +972545621350
    '+972 ' + suffix.slice(0, 2) + '-' + suffix.slice(2, 5) + '-' + suffix.slice(5), // +972 54-562-1350
    suffix,                        // 545621350
  ];
};

/**
 * Check if two phone numbers match (comparing normalized versions)
 */
export const phonesMatch = (phone1: string | null | undefined, phone2: string | null | undefined): boolean => {
  if (!phone1 || !phone2) return false;
  
  const suffix1 = getPhoneSuffix(phone1, 9);
  const suffix2 = getPhoneSuffix(phone2, 9);
  
  return suffix1.length >= 9 && suffix1 === suffix2;
};

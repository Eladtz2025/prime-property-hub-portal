// Country codes for phone number selection

export interface CountryCode {
  code: string;
  label: string;
  prefix: string; // actual prefix to add when saving
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'IL', label: 'ישראל', prefix: '' }, // Israel - no prefix added
  { code: '+1', label: '+1 (ארה"ב/קנדה)', prefix: '+1' },
  { code: '+44', label: '+44 (בריטניה)', prefix: '+44' },
  { code: '+33', label: '+33 (צרפת)', prefix: '+33' },
  { code: '+49', label: '+49 (גרמניה)', prefix: '+49' },
  { code: '+41', label: '+41 (שווייץ)', prefix: '+41' },
  { code: '+7', label: '+7 (רוסיה)', prefix: '+7' },
  { code: '+39', label: '+39 (איטליה)', prefix: '+39' },
  { code: '+34', label: '+34 (ספרד)', prefix: '+34' },
  { code: '+61', label: '+61 (אוסטרליה)', prefix: '+61' },
  { code: '+971', label: '+971 (איחוד האמירויות)', prefix: '+971' },
];

/**
 * Parse a phone number to extract country code and local number
 * Returns { countryCode: 'IL' | '+1' | etc, localNumber: '...' }
 */
export const parsePhoneNumber = (phone: string | null | undefined): { countryCode: string; localNumber: string } => {
  if (!phone) {
    return { countryCode: 'IL', localNumber: '' };
  }

  const cleaned = phone.replace(/\s/g, '');

  // Check if starts with Israeli prefix
  if (cleaned.startsWith('+972')) {
    // Convert +972 to local Israeli format
    const localPart = cleaned.substring(4);
    return { countryCode: 'IL', localNumber: '0' + localPart };
  }

  // Check if starts with 0 (Israeli local format)
  if (cleaned.startsWith('0')) {
    return { countryCode: 'IL', localNumber: phone };
  }

  // Check for international prefixes
  for (const country of COUNTRY_CODES) {
    if (country.prefix && cleaned.startsWith(country.prefix)) {
      const localPart = cleaned.substring(country.prefix.length);
      // Remove leading dash if present
      const cleanLocal = localPart.startsWith('-') ? localPart.substring(1) : localPart;
      return { countryCode: country.code, localNumber: cleanLocal };
    }
  }

  // Default to Israel if no match
  return { countryCode: 'IL', localNumber: phone };
};

/**
 * Combine country code and local number into a full phone string
 * For Israel: just the local number
 * For others: prefix-localNumber
 */
export const combinePhoneNumber = (countryCode: string, localNumber: string): string => {
  if (!localNumber) return '';
  
  const cleanLocal = localNumber.trim();
  
  if (countryCode === 'IL') {
    return cleanLocal;
  }

  // Find the country and get its prefix
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  if (country && country.prefix) {
    return `${country.prefix}-${cleanLocal}`;
  }

  return cleanLocal;
};

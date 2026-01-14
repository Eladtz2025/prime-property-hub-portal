/**
 * Clean and format phone number for display
 * Supports both Israeli and international formats
 * Input examples: "972542284477", "+972-54-228-4477", "0542284477", "+1-555-123-4567"
 * Output: "054-228-4477" for Israeli, "+1555123456" for international
 */
export const formatIsraeliPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters except leading +
  const hasPlus = phone.trim().startsWith('+');
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Israeli international prefix (972)
  if (cleaned.startsWith('972')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  // Add leading 0 if missing for Israeli mobile (e.g., "542284477" -> "0542284477")
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    cleaned = '0' + cleaned;
  }
  
  // Format 10-digit Israeli mobile (054-XXX-XXXX)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Format 9-digit Israeli landline (02-XXX-XXXX or 03-XXX-XXXX)
  if (cleaned.length === 9 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  
  // International numbers - format with + prefix
  if (cleaned.length >= 7 && !cleaned.startsWith('0')) {
    return '+' + cleaned;
  }
  
  // Return with + if original had it, otherwise return cleaned
  return hasPlus ? '+' + cleaned : (cleaned || phone);
};

/**
 * Clean and format Israeli phone number for display
 * Input examples: "972542284477", "+972-54-228-4477", "0542284477", "54-5503055 972+"
 * Output: "054-228-4477" or original if invalid
 */
export const formatIsraeliPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle international prefix (972)
  if (cleaned.startsWith('972')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  // Add leading 0 if missing (e.g., "542284477" -> "0542284477")
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    cleaned = '0' + cleaned;
  }
  
  // Format 10-digit Israeli mobile (054-XXX-XXXX)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Format 9-digit landline (02-XXX-XXXX or 03-XXX-XXXX)
  if (cleaned.length === 9 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  
  // Return cleaned number if can't format
  return cleaned || phone;
};

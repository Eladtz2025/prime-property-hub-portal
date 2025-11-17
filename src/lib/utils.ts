import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Remove building number from address for public display
 * Example: "בן יהודה 173" -> "בן יהודה"
 * Example: "דיזנגוף 50א" -> "דיזנגוף"
 */
export const removeAddressNumber = (address: string): string => {
  // Remove numbers and optional Hebrew letters from the end of the address
  return address.replace(/\s*\d+[א-ת]?\s*$/g, '').trim();
}

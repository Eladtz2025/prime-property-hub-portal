import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates file size and shows error if too large
 * @returns true if valid, false if too large
 */
export const validateFileSize = (file: File, maxSize: number = MAX_FILE_SIZE): boolean => {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    toast.error(`הקובץ גדול מדי. גודל מקסימלי: ${maxSizeMB}MB`);
    return false;
  }
  return true;
};

/**
 * Creates an object URL and returns a cleanup function
 */
export const createPreviewUrl = (file: File): { url: string; cleanup: () => void } => {
  const url = URL.createObjectURL(file);
  return {
    url,
    cleanup: () => URL.revokeObjectURL(url)
  };
};

/**
 * Downloads an image from a URL
 */
export const downloadImage = async (
  imageUrl: string, 
  filename: string = 'property-image.png'
): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    logger.error('Download failed:', error);
    toast.error('שגיאה בהורדת התמונה');
    return false;
  }
};

/**
 * Room type translations for AI prompts (Hebrew to English)
 */
export const roomTypeTranslations: Record<string, string> = {
  'living_room': 'living room',
  'bedroom': 'bedroom',
  'kitchen': 'kitchen',
  'bathroom': 'bathroom',
  'dining_room': 'dining room',
  'office': 'home office',
  'balcony': 'balcony',
  'exterior': 'building exterior',
  'garden': 'garden',
  'staircase': 'staircase area',
  'entrance': 'entrance hall / foyer',
  'hallway': 'hallway / corridor',
  'storage': 'storage room',
  'laundry': 'laundry room',
  'terrace': 'rooftop terrace',
};

/**
 * Style translations for AI prompts (Hebrew to English)
 */
export const styleTranslations: Record<string, string> = {
  'modern': 'modern',
  'classic': 'classic',
  'minimalist': 'minimalist',
  'luxury': 'luxury',
  'scandinavian': 'scandinavian',
  'industrial': 'industrial',
  'mediterranean': 'mediterranean',
  'bohemian': 'bohemian',
};

/**
 * Enhancement type translations for AI prompts
 */
export const enhancementTypeTranslations: Record<string, string> = {
  'lighting': 'Enhance lighting and colors, adjust brightness and contrast',
  'declutter': 'Remove clutter and unnecessary objects from the room',
  'staging': 'Add virtual furniture and decor to make the empty room look furnished',
  'general': 'General optimization for real estate photography',
};

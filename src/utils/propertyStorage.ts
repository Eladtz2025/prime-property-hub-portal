import { Property } from '../types/property';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'property_updates';

export const savePropertyToStorage = async (property: Property): Promise<void> => {
  try {
    const existingUpdates = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    existingUpdates[property.id] = property;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingUpdates));
  } catch (error) {
    logger.error('Error saving property to storage:', error);
    throw error;
  }
};

export const loadPropertiesFromStorage = (): Record<string, Property> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    logger.error('Error loading properties from storage:', error);
    return {};
  }
};

export const getPropertyFromStorage = (id: string): Property | null => {
  const properties = loadPropertiesFromStorage();
  return properties[id] || null;
};

export const mergePropertyWithStorage = (property: Property): Property => {
  const storedProperty = getPropertyFromStorage(property.id);
  if (storedProperty) {
    return {
      ...property,
      ...storedProperty,
      // Ensure we keep the original ID
      id: property.id
    };
  }
  return property;
};

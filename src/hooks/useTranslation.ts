import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY_PREFIX = 'translation_cache_';
const CACHE_EXPIRY_DAYS = 7;

interface CachedTranslation {
  translation: string;
  timestamp: number;
}

const getCacheKey = (text: string): string => {
  return CACHE_KEY_PREFIX + btoa(encodeURIComponent(text)).slice(0, 50);
};

const getCachedTranslation = (text: string): string | null => {
  try {
    const cacheKey = getCacheKey(text);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { translation, timestamp }: CachedTranslation = JSON.parse(cached);
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (Date.now() - timestamp > expiryTime) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return translation;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

const setCachedTranslation = (text: string, translation: string): void => {
  try {
    const cacheKey = getCacheKey(text);
    const cached: CachedTranslation = {
      translation,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const useTranslation = (texts: string[]) => {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const translateTexts = async () => {
      if (!texts || texts.length === 0) {
        setIsLoading(false);
        return;
      }

      const translationMap: Record<string, string> = {};
      const textsToTranslate: string[] = [];

      // Check cache first
      texts.forEach(text => {
        const cached = getCachedTranslation(text);
        if (cached) {
          translationMap[text] = cached;
        } else {
          textsToTranslate.push(text);
        }
      });

      // If all translations are cached, return immediately
      if (textsToTranslate.length === 0) {
        setTranslations(translationMap);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: { texts: textsToTranslate }
        });

        if (error) throw error;

        textsToTranslate.forEach((original, index) => {
          const translation = data.translations[index] || original;
          translationMap[original] = translation;
          setCachedTranslation(original, translation);
        });

        setTranslations(translationMap);
      } catch (error) {
        console.error('Translation error:', error);
        // Fallback: use original texts
        textsToTranslate.forEach(text => {
          translationMap[text] = text;
        });
        setTranslations(translationMap);
      } finally {
        setIsLoading(false);
      }
    };

    translateTexts();
  }, [texts.join(',')]);

  return { translations, isLoading };
};

export const clearTranslationCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Translation cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
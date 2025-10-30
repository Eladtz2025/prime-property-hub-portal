import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTranslation = (texts: string[]) => {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const translateTexts = async () => {
      if (!texts || texts.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: { texts }
        });

        if (error) throw error;

        const translationMap: Record<string, string> = {};
        texts.forEach((original, index) => {
          translationMap[original] = data.translations[index] || original;
        });

        setTranslations(translationMap);
      } catch (error) {
        console.error('Translation error:', error);
        // Fallback: use original texts
        const fallbackMap: Record<string, string> = {};
        texts.forEach(text => {
          fallbackMap[text] = text;
        });
        setTranslations(fallbackMap);
      } finally {
        setIsLoading(false);
      }
    };

    translateTexts();
  }, [texts.join(',')]);

  return { translations, isLoading };
};
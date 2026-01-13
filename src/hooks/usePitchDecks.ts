import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PitchDeck, PitchDeckSlide, DEFAULT_SLIDES } from '@/types/pitch-deck';
import { toast } from 'sonner';

export const usePitchDecks = () => {
  return useQuery({
    queryKey: ['pitch-decks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pitch_decks')
        .select(`
          *,
          property:properties(id, title, address, city, rooms, property_size, floor, elevator, parking, balcony, owner_name, owner_phone, owner_email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PitchDeck[];
    },
  });
};

export const usePitchDeck = (id?: string) => {
  return useQuery({
    queryKey: ['pitch-deck', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('pitch_decks')
        .select(`
          *,
          property:properties(id, title, address, city, rooms, property_size, floor, elevator, parking, balcony, owner_name, owner_phone, owner_email)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Fetch slides
      const { data: slides, error: slidesError } = await supabase
        .from('pitch_deck_slides')
        .select('*')
        .eq('deck_id', id)
        .order('slide_order', { ascending: true });
      
      if (slidesError) throw slidesError;
      
      return { ...data, slides } as PitchDeck;
    },
    enabled: !!id,
  });
};

export const usePitchDeckBySlug = (slug?: string) => {
  return useQuery({
    queryKey: ['pitch-deck-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('pitch_decks')
        .select(`
          *,
          property:properties(id, title, address, city, rooms, property_size, floor, elevator, parking, balcony, owner_name, owner_phone, owner_email)
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      
      // Fetch slides
      const { data: slides, error: slidesError } = await supabase
        .from('pitch_deck_slides')
        .select('*')
        .eq('deck_id', data.id)
        .order('slide_order', { ascending: true });
      
      if (slidesError) throw slidesError;
      
      // Increment view count
      await supabase
        .from('pitch_decks')
        .update({ 
          views_count: (data.views_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', data.id);
      
      return { ...data, slides } as PitchDeck;
    },
    enabled: !!slug,
  });
};

export const useCreatePitchDeck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deck: Partial<PitchDeck>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('pitch_decks')
        .insert({
          title: deck.title || 'New Presentation',
          slug: deck.slug || `presentation-${Date.now()}`,
          language: deck.language || 'he',
          property_id: deck.property_id || null,
          theme_color: deck.theme_color || '#f5c242',
          overlay_opacity: deck.overlay_opacity || 0.85,
          contact_phone: deck.contact_phone,
          contact_whatsapp: deck.contact_whatsapp,
          agent_names: deck.agent_names,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create default slides
      const slidesToInsert = DEFAULT_SLIDES.map(slide => ({
        ...slide,
        deck_id: data.id,
        slide_data: slide.slide_data as unknown as Record<string, unknown>,
      }));
      
      const { error: slidesError } = await supabase
        .from('pitch_deck_slides')
        .insert(slidesToInsert as never[]);
      
      if (slidesError) throw slidesError;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitch-decks'] });
      toast.success('המצגת נוצרה בהצלחה');
    },
    onError: (error) => {
      console.error('Error creating pitch deck:', error);
      toast.error('שגיאה ביצירת המצגת');
    },
  });
};

export const useUpdatePitchDeck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PitchDeck> & { id: string }) => {
      const { data, error } = await supabase
        .from('pitch_decks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pitch-decks'] });
      queryClient.invalidateQueries({ queryKey: ['pitch-deck', data.id] });
      toast.success('המצגת עודכנה בהצלחה');
    },
    onError: (error) => {
      console.error('Error updating pitch deck:', error);
      toast.error('שגיאה בעדכון המצגת');
    },
  });
};

export const useDeletePitchDeck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pitch_decks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitch-decks'] });
      toast.success('המצגת נמחקה בהצלחה');
    },
    onError: (error) => {
      console.error('Error deleting pitch deck:', error);
      toast.error('שגיאה במחיקת המצגת');
    },
  });
};

export const useUpdateSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PitchDeckSlide> & { id: string }) => {
      const updateData = {
        ...updates,
        slide_data: updates.slide_data as unknown as Record<string, unknown>,
      };
      const { data, error } = await supabase
        .from('pitch_deck_slides')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pitch-deck', data.deck_id] });
    },
    onError: (error) => {
      console.error('Error updating slide:', error);
      toast.error('שגיאה בעדכון הסלייד');
    },
  });
};

export const useUpdateSlideOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slides: { id: string; slide_order: number }[]) => {
      const updates = slides.map(slide => 
        supabase
          .from('pitch_deck_slides')
          .update({ slide_order: slide.slide_order })
          .eq('id', slide.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitch-decks'] });
    },
    onError: (error) => {
      console.error('Error updating slide order:', error);
      toast.error('שגיאה בעדכון סדר הסליידים');
    },
  });
};

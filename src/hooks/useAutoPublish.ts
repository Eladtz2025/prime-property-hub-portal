import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAutoPublishQueues() {
  return useQuery({
    queryKey: ['auto-publish-queues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_publish_queues')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveAutoPublishQueue() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (queue: {
      id?: string;
      name: string;
      queue_type: string;
      platforms: string[];
      template_text: string;
      hashtags?: string;
      publish_time?: string;
      frequency?: string;
      frequency_days?: number;
      is_active?: boolean;
      property_filter?: string;
      publish_target?: { type: string; group_ids?: string[] };
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (queue.id) {
        const { id, ...rest } = queue;
        const { error } = await supabase.from('auto_publish_queues').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('auto_publish_queues')
          .insert({ ...queue, created_by: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auto-publish-queues'] });
      toast({ title: 'תור נשמר בהצלחה' });
    },
    onError: (e: Error) => {
      toast({ title: 'שגיאה', description: e.message, variant: 'destructive' });
    },
  });
}

export function useToggleAutoPublishQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('auto_publish_queues')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-publish-queues'] }),
  });
}

export function useDeleteAutoPublishQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auto_publish_queues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-publish-queues'] }),
  });
}

// ─── Articles ───

export function useAutoPublishItems(queueId?: string) {
  return useQuery({
    queryKey: ['auto-publish-items', queueId],
    enabled: !!queueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_publish_items')
        .select('*')
        .eq('queue_id', queueId!)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveAutoPublishItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      queue_id: string;
      title: string;
      content_text: string;
      image_urls?: string[];
      link_url?: string;
      order_index?: number;
    }) => {
      if (item.id) {
        const { id, ...rest } = item;
        const { error } = await supabase.from('auto_publish_items').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        // Get next order_index
        const { data: existing } = await supabase
          .from('auto_publish_items')
          .select('order_index')
          .eq('queue_id', item.queue_id)
          .order('order_index', { ascending: false })
          .limit(1);
        const nextIndex = existing && existing.length > 0 ? (existing[0].order_index + 1) : 0;
        const { error } = await supabase
          .from('auto_publish_items')
          .insert({ ...item, order_index: item.order_index ?? nextIndex });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auto-publish-items'] });
      toast({ title: 'פריט נשמר' });
    },
    onError: (e: Error) => {
      toast({ title: 'שגיאה', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAutoPublishItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auto_publish_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-publish-items'] }),
  });
}

// ─── Log ───

export function useAutoPublishLog(queueId?: string) {
  return useQuery({
    queryKey: ['auto-publish-log', queueId],
    queryFn: async () => {
      let q = supabase
        .from('auto_publish_log')
        .select('*, auto_publish_queues(name)')
        .order('published_at', { ascending: false })
        .limit(50);

      if (queueId) q = q.eq('queue_id', queueId);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ─── Properties for preview ───

export function useWebsiteProperties() {
  return useQuery({
    queryKey: ['website-properties-for-autopub'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, neighborhood, rooms, property_size, floor, monthly_rent, property_type, property_images!inner(id)')
        .eq('show_on_website', true)
        .eq('status', 'vacant')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

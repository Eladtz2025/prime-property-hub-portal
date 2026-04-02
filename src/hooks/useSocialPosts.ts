import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Social Accounts ───

export function useSocialAccounts() {
  return useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveSocialAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (account: {
      platform: string;
      page_id?: string;
      page_name?: string;
      ig_user_id?: string;
      access_token: string;
      token_expires_at?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert — one account per platform
      const { data: existing } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('platform', account.platform)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('social_accounts')
          .update({ ...account, is_active: true })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('social_accounts')
          .insert({ ...account, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-accounts'] });
      toast({ title: 'חשבון נשמר בהצלחה' });
    },
    onError: (e: Error) => {
      toast({ title: 'שגיאה', description: e.message, variant: 'destructive' });
    },
  });
}

// ─── Social Posts ───

export function useSocialPosts(statusFilter?: string, platformFilter?: string) {
  return useQuery({
    queryKey: ['social-posts', statusFilter, platformFilter],
    queryFn: async () => {
      let q = supabase
        .from('social_posts')
        .select('*, social_templates(name), social_facebook_groups(group_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter && statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (platformFilter && platformFilter !== 'all') q = q.eq('platform', platformFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSocialPost() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (post: {
      platform: string;
      post_type?: string;
      content_text?: string;
      image_urls?: string[];
      video_url?: string;
      hashtags?: string;
      status?: string;
      scheduled_at?: string;
      property_id?: string;
      template_id?: string;
      target_group_id?: string;
      link_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('social_posts')
        .insert({ ...post, created_by: user.id, image_urls: post.image_urls || [] })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-posts'] });
      toast({ title: 'פוסט נוצר בהצלחה' });
    },
    onError: (e: Error) => {
      toast({ title: 'שגיאה', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('social_posts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
  });
}

export function useDeleteSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
  });
}

export function usePublishPost() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: string | { postId: string; isPrivate?: boolean }) => {
      const postId = typeof params === 'string' ? params : params.postId;
      const isPrivate = typeof params === 'string' ? false : params.isPrivate;
      const { data, error } = await supabase.functions.invoke('social-publish', {
        body: { post_id: postId, is_private: isPrivate },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['social-posts'] });
      if (data?.success) {
        toast({ title: 'פוסט פורסם בהצלחה! 🎉' });
      } else {
        toast({ title: 'שגיאה בפרסום', description: data?.error, variant: 'destructive' });
      }
    },
    onError: (e: Error) => {
      toast({ title: 'שגיאה', description: e.message, variant: 'destructive' });
    },
  });
}

// ─── Social Templates ───

export function useSocialTemplates() {
  return useQuery({
    queryKey: ['social-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveSocialTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (template: {
      id?: string;
      name: string;
      platform: string;
      post_type: string;
      template_text: string;
      hashtags?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (template.id) {
        const { id, ...rest } = template;
        const { error } = await supabase.from('social_templates').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('social_templates')
          .insert({ ...template, created_by: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-templates'] });
      toast({ title: 'תבנית נשמרה' });
    },
    onError: (e: Error) => {
      toast({ title: 'שגיאה', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSocialTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_templates').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-templates'] }),
  });
}

// ─── Facebook Groups ───

export function useFacebookGroups() {
  return useQuery({
    queryKey: ['facebook-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_facebook_groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveFacebookGroup() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (group: {
      id?: string;
      group_name: string;
      group_url: string;
      category?: string;
      notes?: string;
      is_active?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (group.id) {
        const { id, ...rest } = group;
        const { error } = await supabase.from('social_facebook_groups').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('social_facebook_groups')
          .insert({ ...group, created_by: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facebook-groups'] });
      toast({ title: 'קבוצה נשמרה' });
    },
    onError: (e: Error) => {
      toast({ title: 'שגיאה', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFacebookGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_facebook_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facebook-groups'] }),
  });
}

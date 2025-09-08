import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendNotification } from '@/utils/pwa';
import { logger } from '@/utils/logger';

interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  property_id?: string;
  created_at: string;
  is_read: boolean;
  recipient_id: string;
}

export const useRealtimeNotifications = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotification = payload.new as RealtimeNotification;
          logger.info('New real-time notification:', newNotification);
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Send browser notification
          sendNotification(newNotification.title, {
            body: newNotification.message,
            tag: newNotification.id,
            requireInteraction: newNotification.priority === 'urgent'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as RealtimeNotification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    // Load initial notifications
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
      const unread = data?.filter((n: any) => !n.is_read).length || 0;
      setUnreadCount(unread);
    };

    loadNotifications();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', profile.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
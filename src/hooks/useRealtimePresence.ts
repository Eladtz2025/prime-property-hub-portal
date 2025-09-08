import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentPage?: string;
}

export const useRealtimePresence = (roomId: string = 'main') => {
  const { profile } = useAuth();
  const [presenceData, setPresenceData] = useState<UserPresence[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase.channel(`presence-${roomId}`);

    const userStatus: UserPresence = {
      userId: profile.id,
      userName: profile.full_name || profile.email,
      status: 'online',
      lastSeen: new Date().toISOString(),
      currentPage: window.location.pathname
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users: UserPresence[] = [];
        
        Object.keys(newState).forEach(userId => {
          const presences = newState[userId] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            if (presence && typeof presence === 'object') {
              users.push(presence);
            }
          }
        });
        
        setPresenceData(users);
        setOnlineUsers(users.filter(u => u.status === 'online').length);
        logger.info('Presence sync:', users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        logger.info('User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.info('User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userStatus);
        }
      });

    // Update presence when user becomes active/inactive
    const handleVisibilityChange = () => {
      const newStatus = document.hidden ? 'away' : 'online';
      channel.track({
        ...userStatus,
        status: newStatus,
        lastSeen: new Date().toISOString()
      });
    };

    // Update presence when page changes
    const handleLocationChange = () => {
      channel.track({
        ...userStatus,
        currentPage: window.location.pathname,
        lastSeen: new Date().toISOString()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handleLocationChange);
      supabase.removeChannel(channel);
    };
  }, [profile?.id, roomId]);

  return {
    presenceData,
    onlineUsers,
    currentUser: profile
  };
};
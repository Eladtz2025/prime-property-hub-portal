import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  size?: 'sm' | 'default';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ size = 'default', className }) => {
  const { profile } = useAuth();
  
  const getInitial = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Avatar className={cn(
      size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
      className
    )}>
      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
        {getInitial()}
      </AvatarFallback>
    </Avatar>
  );
};
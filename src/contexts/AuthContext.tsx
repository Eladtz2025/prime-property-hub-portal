import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Permission } from '@/types/auth';
import { getUserProfile, getUserPermissions } from '@/lib/auth';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  permissions: Permission[];
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch from view that includes role
      const { data: userProfile, error } = await supabase
        .from('user_profiles_with_roles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (error) {
        logger.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }
      
      setProfile(userProfile as UserProfile);
      
      if (userProfile?.role) {
        const { data: userPermissions } = await getUserPermissions(userProfile.role as any);
        logger.debug('User profile and permissions loaded', {
          email: userProfile.email,
          role: userProfile.role,
          permissions: userPermissions
        }, 'AuthContext');
        setPermissions((userPermissions || []) as Permission[]);
      }
      
      setLoading(false);
    } catch (error) {
      logger.error('Error refreshing profile:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  };

  const hasPermissionCheck = (resource: string, action: string): boolean => {
    return permissions.some(p => p.resource === resource && p.action === action);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', { event, userId: session?.user?.id });
      
      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshProfile(session.user);
      } else {
        setProfile(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const value: AuthContextType = {
    user,
    profile,
    permissions,
    session,
    loading,
    isAuthenticated: !!user,
    isApproved: profile?.is_approved ?? false,
    hasPermission: hasPermissionCheck,
    signOut: handleSignOut,
    refreshProfile: () => refreshProfile(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
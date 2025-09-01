import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile, Permission, getUserProfile, getUserPermissions } from '@/lib/supabase';
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

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      
      if (userProfile?.role) {
        const { data: userPermissions } = await getUserPermissions(userProfile.role);
        setPermissions(userPermissions || []);
      }
    } catch (error) {
      logger.error('Error refreshing profile:', error);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', { event, userId: session?.user?.id });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshProfile();
      } else {
        setProfile(null);
        setPermissions([]);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (user && !profile) {
      refreshProfile();
    }
  }, [user]);

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
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
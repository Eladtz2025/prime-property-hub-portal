// Auth context for managing user authentication state
import * as React from 'react';
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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      // Fetch from view that includes role
      const { data: userProfile, error } = await supabase
        .from('user_profiles_with_roles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        logger.error('Error fetching profile:', error);
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

  React.useEffect(() => {
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
  React.useEffect(() => {
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
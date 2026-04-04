import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface UserMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

interface ProfileUpdateData {
  [key: string]: string | number | boolean | null | undefined;
}

interface AuthErrorResponse {
  error: AuthError | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<AuthErrorResponse>;
  signIn: (email: string, password: string) => Promise<AuthErrorResponse>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<AuthErrorResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: UserMetadata): Promise<AuthErrorResponse> => {
    try {
      const redirectUrl = `${window.location.origin}/portal`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      if (error) throw error;
      
      toast.success('Account created! Please check your email to verify your account.');
      return { error: null };
    } catch (error: unknown) {
      const authError = error instanceof Error && 'code' in error ? error as AuthError : null;
      logger.error('Sign up error:', error instanceof Error ? error.message : 'Unknown error');
      return { error: authError };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthErrorResponse> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Welcome back!');
      return { error: null };
    } catch (error: unknown) {
      const authError = error instanceof Error && 'code' in error ? error as AuthError : null;
      logger.error('Sign in error:', error instanceof Error ? error.message : 'Unknown error');
      return { error: authError };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Sign out error:', errorMessage);
      toast.error('Error signing out');
    }
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<AuthErrorResponse> => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      return { error: null };
    } catch (error: unknown) {
      const authError = error instanceof Error && 'code' in error ? error as AuthError : null;
      logger.error('Update profile error:', error instanceof Error ? error.message : 'Unknown error');
      return { error: authError };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

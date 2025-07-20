import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'pastor' | 'member';
  household_id: string;
}

interface AuthContextType {
  user: User | null;
  member: Member | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're coming from a password reset
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isPasswordReset = hashParams.get('type') === 'recovery' || 
                           urlParams.get('type') === 'recovery' ||
                           localStorage.getItem('password_reset_requested') === 'true';
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If we have a session and it's a password reset, redirect to set password
      if (session?.user && isPasswordReset) {
        console.log('Password reset flow detected in AuthContext, redirecting to /set-password');
        localStorage.removeItem('password_reset_requested');
        // Set loading to false before redirect
        setLoading(false);
        // Use React Router navigation instead of window.location
        setTimeout(() => {
          window.location.replace('/set-password');
        }, 100);
        return;
      }
      
      if (session?.user) {
        await fetchMemberData(session.user.email!);
      } else {
        setMember(null);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchMemberData(session.user.email!);
      } else {
        setMember(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMemberData = async (email: string) => {
    try {
      console.log('Fetching member data for:', email);
      const { data, error } = await supabase
        .from('members')
        .select('id, email, first_name, last_name, role, household_id')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching member data:', error);
        setMember(null);
        return;
      }

      console.log('Member data fetched:', data);
      setMember(data);
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMember(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    // Use the current origin to handle dynamic port assignments
    const currentOrigin = window.location.origin;
    console.log('Sending password reset with redirectTo:', `${currentOrigin}/auth/callback`);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${currentOrigin}/auth/callback`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    return { error };
  };

  const value = {
    user,
    member,
    session,
    loading,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
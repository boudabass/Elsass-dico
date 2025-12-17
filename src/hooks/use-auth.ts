"use client";

import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define the Profile type based on the Supabase schema
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  email: string; // Added for convenience
}

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabase = createClient();

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async (supabaseUser: SupabaseUser | null) => {
      if (supabaseUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role')
          .eq('id', supabaseUser.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Fallback profile if fetching fails
          setUser({
            id: supabaseUser.id,
            first_name: supabaseUser.email?.split('@')[0] || 'Utilisateur',
            last_name: null,
            avatar_url: null,
            role: 'user',
            email: supabaseUser.email || '',
          });
        } else if (profileData) {
          setUser({
            ...profileData,
            email: supabaseUser.email || '',
          } as Profile);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoading(true);
      fetchUserAndProfile(session?.user || null);

      if (event === 'SIGNED_IN') {
        // Redirect authenticated users away from /login
        if (window.location.pathname === '/login') {
          router.push('/');
        }
      } else if (event === 'SIGNED_OUT') {
        // Redirect unauthenticated users to /login if they are on a protected route (handled by middleware, but good client-side UX)
        // We rely on middleware for protection, but this handles client state cleanup.
        router.refresh();
      }
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserAndProfile(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
    router.push('/login');
  };

  const value = useMemo(() => ({ user, isLoading, signOut }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
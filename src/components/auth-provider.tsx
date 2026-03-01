"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isLoading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Initialisation au montage - récupérer la session existante
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSession(session);
        setUser(session.user);

        // Récupérer le rôle depuis profiles
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.warn("[Auth] Profile fetch error on init:", error.message);
            setRole("user");
          } else {
            setRole(profile?.role ?? "user");
            console.log(`[Auth] Initial role: ${profile?.role ?? "user"}`);
          }
        } catch (err) {
          console.error("[Auth] Unexpected profile error on init:", err);
          setRole("user");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event} | Session: ${session ? 'Active' : 'None'}`);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Récupérer le rôle depuis profiles
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.warn("[Auth] Profile fetch error:", error.message);
            setRole("user");
          } else {
            setRole(profile?.role ?? "user");
            console.log(`[Auth] Role set: ${profile?.role ?? "user"}`);
          }
        } catch (err) {
          console.error("[Auth] Unexpected profile error:", err);
          setRole("user");
        }
      } else {
        setRole(null);
      }

      setIsLoading(false);

      if (event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    // Calls the Server Action to clear HttpOnly cookies and redirect
    await signOutAction();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
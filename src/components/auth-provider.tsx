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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event} | Session: ${session ? 'Active' : 'None'}`);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const metadataRole = session.user.user_metadata?.role;
        console.log(`[Auth] User ID: ${session.user.id}. Metadata Role: ${metadataRole || 'None'}`);

        // Priorité 1: Utiliser le rôle des métadonnées s'il existe (Rapide, pas de requête)
        if (metadataRole) {
          setRole(metadataRole);
          setIsLoading(false);
          console.log(`[Auth] Role set from metadata: ${metadataRole}`);
        }

        // Priorité 2: Vérifier la table profiles (Plus fiable mais plus lent)
        // On le fait même si on a les métadonnées pour être sûr d'être à jour, 
        // mais on ne bloque pas l'UI si on a déjà un rôle.
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.warn("[Auth] Profile fetch error:", error.message);
            if (!metadataRole) setRole("user");
          } else {
            const finalRole = profile?.role ?? "user";
            console.log(`[Auth] Profile fetched. Role: ${finalRole}`);
            setRole(finalRole);
          }
        } catch (err) {
          console.error("[Auth] Unexpected profile error:", err);
          if (!metadataRole) setRole("user");
        } finally {
          setIsLoading(false);
          console.log("[Auth] Auth lifecycle ready.");
        }
      } else {
        console.log("[Auth] No session user found.");
        setRole(null);
        setIsLoading(false);
      }

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
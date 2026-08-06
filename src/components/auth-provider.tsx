"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  const supabase = useMemo(() => createClient(), []);
  const userId = user?.id ?? null;

  useEffect(() => {
    // Ce callback DOIT rester synchrone et ne faire aucun appel Supabase.
    // Le client attend sa résolution avant de rendre la main : une requête
    // lancée ici attendrait la fin de l'opération en cours, qui attend
    // elle-même ce callback. Symptôme observé en production : updateUser()
    // ne retournait jamais et le bouton restait bloqué. Le rôle est donc
    // chargé plus bas, dans un effet séparé.
    //
    // INITIAL_SESSION est émis dès l'abonnement, y compris sans session : il
    // sert d'initialisation, aucun getSession() supplémentaire n'est requis.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] Event: ${event} | Session: ${session ? 'Active' : 'None'}`);

      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
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

  useEffect(() => {
    if (!userId) return;

    let annule = false;

    const chargerRole = async () => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (annule) return;

        if (error) {
          console.warn("[Auth] Profile fetch error:", error.message);
          setRole("user");
        } else {
          setRole(profile?.role ?? "user");
          console.log(`[Auth] Role set: ${profile?.role ?? "user"}`);
        }
      } catch (err) {
        if (!annule) {
          console.error("[Auth] Unexpected profile error:", err);
          setRole("user");
        }
      }
    };

    chargerRole();

    return () => {
      annule = true;
    };
  }, [supabase, userId]);

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

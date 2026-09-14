"use client";

import { useEffect, useRef } from "react";
import { createContext, useContext } from "react";

import { deconnexionAction } from "@/app/actions/auth";
import { viderCache } from "@/lib/cache-navigation";
import type { Session } from "@/lib/session";

// La session ne se découvre plus, elle est DONNÉE.
//
// Jusqu'au 12/09/2026 ce composant ouvrait un client Supabase, s'abonnait à
// `onAuthStateChange`, puis lançait un second appel réseau pour aller chercher
// le rôle dans `profiles` — deux requêtes au montage de chaque page, dont une
// qui ne servait qu'à répondre « admin ou pas ». Le layout racine est un
// composant serveur : il lit le cookie signé et passe la session en prop. Zéro
// requête côté navigateur, et plus d'état `isLoading` à faire clignoter.

interface ContexteAuth {
    session: Session | null;
    role: Session["role"] | null;
    deconnexion: () => Promise<void>;
}

const AuthContext = createContext<ContexteAuth>({
    session: null,
    role: null,
    deconnexion: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({
    session,
    children,
}: {
    session: Session | null;
    children: React.ReactNode;
}) {
    // Filet contre une fuite d'un compte à l'autre sur un poste partagé : les
    // clés d'écran authentifiées portent déjà l'identité, mais une purge
    // franche évite d'avoir à en dépendre.
    const identitePrecedente = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        const identite = session?.membreId ?? null;
        if (identitePrecedente.current !== undefined && identitePrecedente.current !== identite) {
            viderCache();
        }
        identitePrecedente.current = identite;
    }, [session?.membreId]);

    const deconnexion = async () => {
        await deconnexionAction();
        // Navigation complète volontaire : un `router.refresh()` laisserait en
        // place les états client des écrans déjà montés.
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ session, role: session?.role ?? null, deconnexion }}>
            {children}
        </AuthContext.Provider>
    );
}

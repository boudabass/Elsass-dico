"use client";

import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { cleCache } from "@/lib/cache-navigation";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";

// Protocole commun aux trois écrans admin (doc 20 : membres, sources,
// signalements) : n'appeler l'action que pour un admin, avertir par toast puis
// retomber sur une liste vide en cas d'échec. Extrait le 19/09/2026 après
// constat que les trois écrans le recopiaient à l'identique — même seuil que
// celui déjà appliqué à `CarteVariante` le 13/09 (« trois écrans l'affichent
// désormais, ce qui justifie l'extraction »).
//
// Le contrat attend `{ succes: true; liste: T[] }`, pas la forme propre à
// chaque action (`membres`/`sources`/`signalements`) : uniformiser le champ
// ICI, dans le petit adaptateur que chaque appelant passe, évite un type
// générique sur la forme brute de l'action — qui aurait forcé un cast interne,
// `res.succes` ne narrowant pas un type générique contraint à une union comme
// il narrow une union concrète.
//
// Le middleware redirige déjà un non-admin ; `estAdmin` n'est ici qu'un
// garde-fou pour le cas où il serait contourné — la vraie barrière est
// `adminExige()`, relue en base à chaque Server Action.

export type ResultatListeAdmin<T> = { succes: true; liste: T[] } | { succes: false; erreur: string };

interface EtatListeAdmin<T> {
    estAdmin: boolean;
    items: T[];
    premierChargement: boolean;
    rafraichir: () => Promise<void>;
}

export function useListeAdmin<T>(
    cleBase: string,
    charger: () => Promise<ResultatListeAdmin<T>>,
): EtatListeAdmin<T> {
    const { session, role } = useAuth();
    const estAdmin = Boolean(session) && role === "admin";

    const { donnees, premierChargement, rafraichir } = useListeMemorisee<T[]>({
        cle: estAdmin ? cleCache(cleBase, session!.membreId) : null,
        charger: async () => {
            const res = await charger();
            if (!res.succes) {
                toast.error(res.erreur);
                return [];
            }
            return res.liste;
        },
    });

    return { estAdmin, items: donnees ?? [], premierChargement, rafraichir };
}

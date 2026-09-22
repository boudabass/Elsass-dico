"use client";

import { useEffect, useState } from "react";

// Une recherche ne part qu'une fois la frappe retombée, et jamais sur moins de
// deux caractères (les recherches côté serveur les refusent de toute façon).
// Rend la requête à soumettre, ou "" tant qu'il n'y a rien à chercher.
//
// Le vidage est immédiat, seul l'envoi est différé : effacer le champ ne doit
// pas laisser les suggestions du terme précédent à l'écran pendant 250 ms.
const LONGUEUR_MIN = 2;

export function useRequeteDebattue(saisie: string, delaiMs = 250): string {
    const cible = saisie.trim().length >= LONGUEUR_MIN ? saisie.trim() : "";
    const [requete, setRequete] = useState(cible);

    useEffect(() => {
        if (!cible) {
            setRequete("");
            return;
        }
        const minuteur = setTimeout(() => setRequete(cible), delaiMs);
        return () => clearTimeout(minuteur);
    }, [cible, delaiMs]);

    return requete;
}

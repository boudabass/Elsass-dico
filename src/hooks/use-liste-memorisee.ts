"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chargerAvecCache, invaliderCache, lireCache } from "@/lib/cache-navigation";

// Charge une liste en la mémorisant par clé d'écran, pour qu'un retour la
// réaffiche telle quelle au lieu de la recharger de zéro.
//
// La règle de fraîcheur suit la décision de John (02/09/2026) : afficher le
// cache immédiatement, rafraîchir derrière. Avec une nuance qui sert la
// contrainte CPU du VPS — en deçà de FRAICHEUR_MS, on ne rappelle même pas le
// serveur. Un aller-retour vers une fiche de mot prend 3 à 10 secondes : c'est
// le cas dominant, et c'est là que le nombre d'appels baisse vraiment. Au-delà,
// le cache est peint puis la revalidation part en fond. Le nombre d'appels
// n'augmente jamais par rapport à l'existant.
const FRAICHEUR_MS = 15_000;

interface Options<T> {
    // Clé d'écran. `null` = on ne charge rien (rôle pas encore résolu, accès
    // refusé) : le hook reste inerte au lieu d'appeler avec une identité vide.
    cle: string | null;
    charger: () => Promise<T>;
    fraicheurMs?: number;
}

interface Etat<T> {
    donnees: T | null;
    // Seul cas où un squelette se justifie : rien en cache, rien à peindre.
    premierChargement: boolean;
    // Revalidation en fond, cache déjà à l'écran — ne doit jamais vider la liste.
    revalidation: boolean;
    // Force le réseau et écrase le cache. Remplace les rafraichir()/refreshUsers()
    // que les pages appellent déjà après leurs propres mutations.
    rafraichir: () => Promise<void>;
}

export function useListeMemorisee<T>({ cle, charger, fraicheurMs = FRAICHEUR_MS }: Options<T>): Etat<T> {
    // `charger` est une closure recréée à chaque rendu : la garder dans une ref
    // plutôt que dans les dépendances de l'effet est ce qui évite la boucle
    // infinie classique des hooks de chargement maison.
    const chargerRef = useRef(charger);
    chargerRef.current = charger;

    // Lecture SYNCHRONE du cache au premier rendu. Indispensable : si les
    // données arrivaient par un setState dans un effet, il y aurait une
    // peinture intermédiaire avec une liste vide — la page n'aurait pas sa
    // hauteur et la restauration du scroll n'aurait rien où aller.
    const [donnees, setDonnees] = useState<T | null>(() => (cle ? lireCache<T>(cle)?.donnees ?? null : null));
    const [enCours, setEnCours] = useState(false);

    // Au changement de clé, on re-dérive PENDANT le rendu (motif React
    // « ajuster l'état quand les props changent ») plutôt que dans un effet,
    // pour la même raison : ne jamais laisser passer une frame vide.
    const cleRef = useRef(cle);
    if (cle !== cleRef.current) {
        cleRef.current = cle;
        setDonnees(cle ? lireCache<T>(cle)?.donnees ?? null : null);
    }

    useEffect(() => {
        if (!cle) return;

        const enCache = lireCache<T>(cle);
        if (enCache && Date.now() - enCache.datee < fraicheurMs) return;

        let annule = false;
        setEnCours(true);
        chargerAvecCache<T>(cle, () => chargerRef.current())
            .then((resultat) => {
                // Deux gardes de course : le composant peut avoir été démonté,
                // et la clé peut avoir changé pendant le vol (frappe rapide,
                // changement de lettre). Le cache, lui, a toujours été écrit —
                // il est keyé, donc jamais faux.
                if (!annule && cleRef.current === cle) setDonnees(resultat);
            })
            .finally(() => {
                if (!annule) setEnCours(false);
            });

        return () => {
            annule = true;
        };
    }, [cle, fraicheurMs]);

    const rafraichir = useCallback(async () => {
        if (!cle) return;
        invaliderCache(cle);
        setEnCours(true);
        try {
            const resultat = await chargerAvecCache<T>(cle, () => chargerRef.current());
            if (cleRef.current === cle) setDonnees(resultat);
        } finally {
            setEnCours(false);
        }
    }, [cle]);

    return {
        donnees,
        premierChargement: enCours && donnees === null,
        revalidation: enCours && donnees !== null,
        rafraichir,
    };
}

"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { estRetourHistorique, lireScroll, memoriserScroll } from "@/lib/cache-navigation";

// Restaure la position dans la liste quand on revient sur un écran.
//
// Pourquoi le navigateur n'y arrive pas seul : sa restauration native
// s'applique avant que React n'ait commité l'arbre, donc sur un document
// encore vide — la position demandée est écrêtée à ~0. C'est exactement la
// panne décrite (« la liste se recharge de zéro »). L'App Router, lui, ne
// scrolle pas du tout sur un retour : il ne remet en haut que sur un push.
// Notre restauration n'a donc pas de concurrent, elle arrive simplement après.
//
// `history.scrollRestoration` n'est délibérément pas touché : le passer à
// "manual" désactiverait aussi la restauration native au rechargement (F5),
// où elle fonctionne très bien puisque le HTML rendu côté serveur a sa hauteur.
export function useScrollMemorise(cle: string | null, pret: boolean): void {
    const dejaRestaure = useRef(false);

    // Capture continue plutôt qu'au seul démontage : sur un retour, le
    // navigateur peut avoir déjà appliqué sa propre restauration avant que
    // React ne démonte l'écran — le window.scrollY lu au cleanup serait alors
    // déjà faussé. L'écouteur est passif et coalescé par frame, et n'écrit
    // qu'un nombre : aucun rendu déclenché, aucun coût serveur.
    useEffect(() => {
        if (!cle) return;

        let frame = 0;
        const surScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                memoriserScroll(cle, window.scrollY);
            });
        };

        window.addEventListener("scroll", surScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", surScroll);
            if (frame) cancelAnimationFrame(frame);
            // Dernier relevé, pour le cas d'un clic survenu avant la frame
            // suivante. Jamais 0 : au démontage la position peut déjà avoir
            // été remise en haut, et on écraserait la bonne valeur.
            const y = window.scrollY;
            if (y > 0) memoriserScroll(cle, y);
        };
    }, [cle]);

    useLayoutEffect(() => {
        dejaRestaure.current = false;
    }, [cle]);

    useLayoutEffect(() => {
        if (!cle || !pret || dejaRestaure.current) return;
        // Un clic sur un onglet de la barre de nav n'est pas un retour : on y
        // arrive en haut de page, avec ses filtres mais pas sa position.
        if (!estRetourHistorique()) return;

        const y = lireScroll(cle);
        if (!y) return;

        // Une seule fois par écran : sans ce drapeau, la revalidation en fond
        // (qui change les données, donc re-commite) ramènerait l'utilisateur
        // en arrière pendant qu'il lit.
        dejaRestaure.current = true;
        // useLayoutEffect, pas useEffect : on scrolle AVANT la peinture, sinon
        // la liste s'affiche en haut le temps d'une frame puis saute.
        window.scrollTo(0, y);
        const frame = requestAnimationFrame(() => window.scrollTo(0, y));
        return () => cancelAnimationFrame(frame);
    }, [cle, pret]);
}

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { COOKIE_SENS, lireSens, type Sens } from "@/lib/sens";

// Le sens courant, pour toute l'app connectée. Même principe que la session :
// il est DONNÉ par RootLayout, qui l'a lu dans le cookie côté serveur et l'a
// déjà posé en `data-sens` sur <html> — aucun flash de la mauvaise couleur au
// chargement. Changer de sens réécrit le cookie, l'attribut et ce contexte ;
// les couleurs suivent seules (tokens --sens-*), les écrans qui chargent des
// données relisent `sens` dans leur clé de cache.

interface ContexteSens {
    sens: Sens;
    definirSens: (sens: Sens) => void;
    inverser: () => void;
}

const SensContext = createContext<ContexteSens>({
    sens: "fr",
    definirSens: () => { },
    inverser: () => { },
});

export const useSens = () => useContext(SensContext);

// Un an : c'est une préférence de lecture, pas une donnée à protéger.
const DUREE_COOKIE = 60 * 60 * 24 * 365;

export function SensProvider({ sensInitial, children }: { sensInitial: Sens; children: React.ReactNode }) {
    const [sens, setSens] = useState<Sens>(sensInitial);

    const definirSens = useCallback((suivant: Sens) => {
        // Un choix du membre prime sur toute URL rouverte ensuite.
        urlDejaLue = true;
        setSens(suivant);
        document.documentElement.dataset.sens = suivant;
        document.cookie = `${COOKIE_SENS}=${suivant}; path=/; max-age=${DUREE_COOKIE}; samesite=lax`;
    }, []);

    const inverser = useCallback(() => {
        urlDejaLue = true;
        setSens((actuel) => {
            const suivant: Sens = actuel === "fr" ? "als" : "fr";
            document.documentElement.dataset.sens = suivant;
            document.cookie = `${COOKIE_SENS}=${suivant}; path=/; max-age=${DUREE_COOKIE}; samesite=lax`;
            return suivant;
        });
    }, []);

    return (
        <SensContext.Provider value={{ sens, definirSens, inverser }}>
            {children}
        </SensContext.Provider>
    );
}

// Le sens d'une URL ne s'adopte qu'une fois par chargement de l'app, sur le
// premier écran affiché. Ensuite, le sens est global (retour de John,
// 27/09/2026) : chaque écran écrit son sens dans son URL, que la barre de nav
// mémorise et que le bouton retour rouvre. Adoptée à chaque montage, cette
// URL ramenait la page dans le sens où on l'avait quittée : recherche en
// français, dictionnaire passé en alsacien, retour à la recherche, et le sens
// repassait en français.
let urlDejaLue = false;

/** Un lien partagé porte son sens (`?sens=als`) : l'écran qui l'ouvre l'adopte
 *  à l'arrivée, sinon le destinataire lirait la recherche dans l'autre sens
 *  que celui qu'on lui a envoyé. Seulement à l'arrivée dans l'app : une
 *  navigation interne garde le sens choisi. */
export function useSensDepuisUrl(parametre: string | null) {
    const { sens, definirSens } = useSens();
    useEffect(() => {
        if (urlDejaLue) return;
        urlDejaLue = true;
        if (parametre === null) return;
        const voulu = lireSens(parametre);
        if (voulu !== sens) definirSens(voulu);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

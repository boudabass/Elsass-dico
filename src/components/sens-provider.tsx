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
        setSens(suivant);
        document.documentElement.dataset.sens = suivant;
        document.cookie = `${COOKIE_SENS}=${suivant}; path=/; max-age=${DUREE_COOKIE}; samesite=lax`;
    }, []);

    const inverser = useCallback(() => {
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

/** Un lien partagé porte son sens (`?sens=als`) : l'écran qui l'ouvre l'adopte
 *  à l'arrivée, sinon le destinataire lirait la recherche dans l'autre sens
 *  que celui qu'on lui a envoyé. Lu une fois, au montage. */
export function useSensDepuisUrl(parametre: string | null) {
    const { sens, definirSens } = useSens();
    useEffect(() => {
        if (parametre === null) return;
        const voulu = lireSens(parametre);
        if (voulu !== sens) definirSens(voulu);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

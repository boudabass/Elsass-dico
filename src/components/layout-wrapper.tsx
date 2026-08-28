"use client";

import { usePathname } from "next/navigation";

// Depuis le passage mobile-first du 28/08/2026 (design_handoff_mobile_app/),
// chaque écran compose son propre <AppHeader> (racine à icônes ou empilé à
// chevron retour) en tête de sa propre arborescence — les titres et l'onglet
// actif varient trop d'un écran à l'autre pour qu'un header générique basé
// sur la seule route les devine. LayoutWrapper n'a donc plus qu'à fournir le
// fond de page ; MainNav/UserNav (nav desktop du 25/08) ne sont plus montés.
//
// Largeur (29/08/2026, retour utilisateur) : le handoff est dessiné pour un
// gabarit téléphone (402px), d'où un max-w-md fixe au départ. Mais ce
// plafond enveloppait TOUTES les routes, y compris /admin/* dont les pages
// portent déjà leurs propres conteneurs plus larges (max-w-5xl/max-w-6xl,
// hérités du 25/08) — imbriqués dans un parent plus étroit, ces conteneurs
// n'avaient plus aucun effet. La largeur est donc désormais conditionnelle :
// progressive par palier pour les écrans app (une colonne qui reste une
// colonne, juste plus large), large fixe pour /admin/* afin de laisser ses
// conteneurs internes reprendre la main. Le fond neutre autour de la colonne
// est conservé : sur grand écran, il signale que l'espacement est voulu.
const LARGEUR_APP = "max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl";
const LARGEUR_ADMIN = "max-w-6xl";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const largeur = pathname?.startsWith("/admin") ? LARGEUR_ADMIN : LARGEUR_APP;

    return (
        <div className="min-h-screen bg-neutre-50">
            <div className={`mx-auto min-h-screen w-full ${largeur} bg-background`}>{children}</div>
        </div>
    );
}
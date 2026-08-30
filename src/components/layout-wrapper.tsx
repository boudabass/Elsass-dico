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
// n'avaient plus aucun effet.
//
// Révisé le 30/08/2026 (retour utilisateur) : plafonner la colonne app
// (même progressivement, jusqu'à max-w-3xl) laissait encore de grandes
// bandes de fond neutre de chaque côté sur tablette/desktop. Décision :
// la colonne app prend toute la largeur disponible — aucun plafond — la
// disposition mobile-first (une colonne, pas de grille multi-colonnes)
// reste inchangée à l'intérieur ; seule la largeur du conteneur change.
// /admin/* garde son plafond fixe, ses conteneurs internes reprenant la
// main comme avant.
const LARGEUR_APP = "";
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
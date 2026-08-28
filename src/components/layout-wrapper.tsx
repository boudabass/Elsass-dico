// Depuis le passage mobile-first du 28/08/2026 (design_handoff_mobile_app/),
// chaque écran compose son propre <AppHeader> (racine à icônes ou empilé à
// chevron retour) en tête de sa propre arborescence — les titres et l'onglet
// actif varient trop d'un écran à l'autre pour qu'un header générique basé
// sur la seule route les devine. LayoutWrapper n'a donc plus qu'à fournir le
// fond de page ; MainNav/UserNav (nav desktop du 25/08) ne sont plus montés.
// max-w-md : le handoff est dessiné pour un gabarit téléphone (402px). Sans
// cette limite, la pastille de recherche et les autres rangées flex
// s'étirent sur toute la largeur d'un écran desktop — jamais vérifié dans le
// mockup, qui ne montre que des cadres de téléphone. Centré plutôt que
// bloqué à gauche, comme la plupart des apps mobile-first consultées depuis
// un navigateur large.
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-neutre-50">
            <div className="mx-auto min-h-screen w-full max-w-md bg-background">{children}</div>
        </div>
    );
}
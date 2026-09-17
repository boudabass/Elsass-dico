import "leaflet/dist/leaflet.css"

import { CarteDemo } from "./carte-demo"

// Écran central de la refonte (doc 20, étape 4) — raccordé à AppNavShell le
// 17/09/2026 : jusque-là cet écran restait joignable uniquement en tapant
// l'URL, absent de ONGLETS (src/components/app-nav-shell.tsx), ce qui en
// faisait un cul-de-sac malgré l'étape 4 « close » du 16/09.
//
// Les 819 communes qui portent au moins une forme attestée ne sont plus lues
// ici : `pointsCarteAction()` (`src/app/actions/carte.ts`) est appelée côté
// client, après montage, pour que le rendu serveur de cette page reste léger.

export const metadata = { title: "Carte des parlers" }

export default function PageCarte() {
    return <CarteDemo />
}

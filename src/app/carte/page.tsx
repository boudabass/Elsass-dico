import "leaflet/dist/leaflet.css"

import { CarteDemo } from "./carte-demo"

// Prototype de l'écran central de la refonte (doc 20, étape 4). Il n'est pas
// l'écran final — il sert à trancher sur pièces plutôt que sur une maquette :
// fond de carte, densité des points, lisibilité en mobile.
//
// Les 819 communes qui portent au moins une forme attestée ne sont plus lues
// ici : `pointsCarteAction()` (`src/app/actions/carte.ts`) est appelée côté
// client, après montage, pour que le rendu serveur de cette page reste léger.

export const metadata = { title: "Carte des parlers — prototype" }

export default function PageCarte() {
    return <CarteDemo />
}

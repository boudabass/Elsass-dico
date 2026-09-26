import "leaflet/dist/leaflet.css"

import { EcranJeu } from "./ecran-jeu"

// Le jeu « Quel village dit ça ? » (brief validé par John le 25/09/2026).
// Ouvert sans compte depuis le 26/09/2026 (décision de John) : les posts du
// défi renvoient ici. Un invité joue le défi du jour, un membre a tout le jeu.

export const metadata = {
    title: "Le défi du jour",
    description: "Des formes alsaciennes attestées : retrouve le village qui les dit. Un défi par jour, cinq manches.",
}

export default function PageJeu() {
    return <EcranJeu />
}

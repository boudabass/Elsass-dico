import "leaflet/dist/leaflet.css"

import { EcranJeu } from "./ecran-jeu"

// Le jeu « Quel village dit ça ? » (brief validé par John le 25/09/2026).
// Réservé aux membres (le middleware protège tout chemin non public), mais
// fait pour attirer : le résultat du défi du jour se partage, et renvoie vers
// la home publique.

export const metadata = { title: "Jeu" }

export default function PageJeu() {
    return <EcranJeu />
}

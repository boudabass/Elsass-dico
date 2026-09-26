import "leaflet/dist/leaflet.css"

import type { Metadata } from "next"

import { jourActuel, numeroDefi } from "@/lib/jeu"

import { EcranJeu } from "./ecran-jeu"

// Le jeu « Quel village dit ça ? » (brief validé par John le 25/09/2026).
// Ouvert sans compte depuis le 26/09/2026 (décision de John) : les posts du
// défi renvoient ici. Un invité joue le défi du jour, un membre a tout le jeu.

const DESCRIPTION = "Des formes alsaciennes attestées : retrouve le village qui les dit. Un défi par jour, cinq manches."

// Le lien collé sur un réseau social s'affiche avec l'image du défi du jour.
// Adresse absolue exigée par les robots : c'est celle de la production.
export function generateMetadata(): Metadata {
    const image = `/api/partage/defi?n=${numeroDefi(jourActuel())}&format=og`
    return {
        metadataBase: new URL("https://elsass-dico.theelsassisch.com"),
        title: "Le défi du jour",
        description: DESCRIPTION,
        openGraph: {
            title: "Le défi du jour",
            description: DESCRIPTION,
            url: "/jeu",
            images: [{ url: image, width: 1200, height: 630 }],
        },
        twitter: { card: "summary_large_image", images: [image] },
    }
}

export default function PageJeu() {
    return <EcranJeu />
}

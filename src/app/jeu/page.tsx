import "leaflet/dist/leaflet.css"

import type { Metadata } from "next"

import { jourActuel, NB_MANCHES, numeroDefi } from "@/lib/jeu"

import { EcranJeu } from "./ecran-jeu"

// Le jeu « Quel village dit ça ? » (brief validé par John le 25/09/2026).
// Ouvert sans compte depuis le 26/09/2026 (décision de John) : les posts du
// défi renvoient ici. Un invité joue le défi du jour, un membre a tout le jeu.

const DESCRIPTION = "Un nom en alsacien, 4 réponses en français : trouve la bonne. Un nouveau défi chaque jour."

// Le lien collé sur un réseau social s'affiche avec une image du défi.
// Le bouton « Partager mon résultat » envoie `/jeu?n=4&r=11110` : la
// messagerie qui lit ce lien dessine l'aperçu avec le score du joueur. Sans
// ces paramètres, l'aperçu invite au défi du jour. L'écran, lui, les ignore :
// celui qui clique joue le défi du jour (06/10/2026, avec John).
// Adresse absolue exigée par les robots : c'est celle de la production.
export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
    const params = await searchParams
    const actuel = numeroDefi(jourActuel())
    const n = Number(params.n)
    const r = typeof params.r === "string" ? params.r : ""
    const resultat = Number.isInteger(n) && n >= 1 && n <= actuel && new RegExp(`^[01]{${NB_MANCHES}}$`).test(r)
    const score = r.split("").filter((c) => c === "1").length
    const image = resultat
        ? `/api/partage/defi?n=${n}&r=${r}&format=og`
        : `/api/partage/defi?n=${actuel}&format=og`
    const titre = resultat ? `Le défi du jour n° ${n} : ${score}/${NB_MANCHES}` : "Le défi du jour"
    return {
        metadataBase: new URL("https://elsass-dico.theelsassisch.com"),
        title: "Le défi du jour",
        description: DESCRIPTION,
        openGraph: {
            title: titre,
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

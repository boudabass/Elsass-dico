import "leaflet/dist/leaflet.css"

import { prisma } from "@/lib/prisma"

import { CarteDemo } from "./carte-demo"

// Prototype de l'écran central de la refonte (doc 20, étape 4). Il n'est pas
// l'écran final — il sert à trancher sur pièces plutôt que sur une maquette :
// fond de carte, densité des points, lisibilité en mobile.
//
// Les données sont réelles : les 819 communes qui portent au moins une forme
// attestée, lues en base au rendu.

export const metadata = { title: "Carte des parlers — prototype" }

export default async function PageCarte() {
    const villages = await prisma.lemme.findMany({
        where: { NOT: { communeId: null }, commune: { isNot: null } },
        select: {
            commune: { select: { id: true, nom: true, latitude: true, longitude: true } },
            variantes: {
                where: { masquee: false },
                select: { forme: true },
                orderBy: { creeLe: "asc" },
            },
        },
    })

    const points = villages
        .filter((v) => v.commune && v.variantes.length)
        .map((v) => ({
            id: v.commune!.id,
            nom: v.commune!.nom,
            latitude: v.commune!.latitude,
            longitude: v.commune!.longitude,
            formes: v.variantes.map((x) => x.forme),
        }))

    const total = points.reduce((n, p) => n + p.formes.length, 0)

    return <CarteDemo points={points} nbFormes={total} />
}

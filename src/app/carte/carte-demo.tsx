"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useMemo, useState } from "react"

import { pointsCarteAction, type PointsCarte } from "@/app/actions/carte"
import type { PointParler } from "@/components/carte-parlers"
import { useListeMemorisee } from "@/hooks/use-liste-memorisee"
import { cleCache } from "@/lib/cache-navigation"
import { couleurDeForme } from "@/lib/couleur-carte"

// `ssr: false` parce que Leaflet lit `window` à l'import : sans ça, le build
// échoue au prérendu de la page.
const CarteParlers = dynamic(
    () => import("@/components/carte-parlers").then((m) => m.CarteParlers),
    { ssr: false, loading: () => <Cadre>Chargement de la carte…</Cadre> },
)

function Cadre({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-[70vh] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
            {children}
        </div>
    )
}

export function CarteDemo() {
    const [terme, setTerme] = useState("")

    const { donnees, premierChargement } = useListeMemorisee<PointsCarte>({
        // Donnée publique, la même pour tout le monde : pas de segment
        // d'identité dans la clé, contrairement aux listes propres à un
        // membre (`admin-membres`, `mon-espace`).
        cle: cleCache("carte-parlers"),
        charger: pointsCarteAction,
    })

    const points: PointParler[] = donnees?.points ?? []
    const nbFormes = donnees?.nbFormes ?? 0

    const filtres = useMemo(() => {
        const t = terme.trim().toLowerCase()
        if (!t) return points
        return points.filter((p) =>
            p.nom.toLowerCase().includes(t)
            || p.formes.some((f) => f.toLowerCase().includes(t)))
    }, [points, terme])

    return (
        <main className="mx-auto w-full max-w-5xl space-y-4 p-4 pb-16 md:pb-4 md:pl-20 lg:pl-56">
            <header className="space-y-1">
                <h1 className="text-xl font-semibold">Carte des parlers</h1>
                <p className="text-sm text-muted-foreground">
                    Prototype — {points.length} villages portent {nbFormes} formes
                    attestées. Chaque point est une commune ; cliquer dessus montre
                    les formes que les sources écrivent pour elle. Une couleur par
                    forme : deux villages qui disent pareil se voient d'un coup d'œil.
                </p>
            </header>

            <input
                value={terme}
                onChange={(e) => setTerme(e.target.value)}
                placeholder="Filtrer par village ou par forme…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                // `text-base` et non `text-sm` : en dessous de 16 px, iOS zoome
                // sur le champ au focus et casse le cadrage de la carte.
            />

            {premierChargement ? (
                <Cadre>Chargement des villages…</Cadre>
            ) : (
                <CarteParlers
                    points={filtres}
                    couleurDe={couleurDeForme}
                    className="h-[70vh] w-full overflow-hidden rounded-lg border"
                />
            )}

            <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                    {filtres.length} village{filtres.length > 1 ? "s" : ""} affiché
                    {filtres.length > 1 ? "s" : ""}.
                </span>
                {/* La mention de paternité exigée par la Licence Ouverte vit ici
                    plutôt que sur la carte : le texte de la licence n'impose
                    aucun emplacement, et accepte même un simple renvoi. */}
                <Link href="/sources" className="underline">Sources</Link>
            </p>
        </main>
    )
}

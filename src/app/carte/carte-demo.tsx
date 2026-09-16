"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { pointsCarteAction, pointsMotAction, type PointsCarte, type PointsMot } from "@/app/actions/carte"
import { rechercherAction } from "@/app/actions/recherche"
import type { PointParler } from "@/components/carte-parlers"
import { useListeMemorisee } from "@/hooks/use-liste-memorisee"
import { cleCache } from "@/lib/cache-navigation"
import { couleurDeForme } from "@/lib/couleur-carte"
import type { LemmeResume } from "@/lib/dictionnaire"

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

    // --- Recherche d'un mot quelconque (doc 20, étape 4) --------------------
    //
    // Distincte du filtre ci-dessous : celui-ci ne fait que réduire les 819
    // points déjà chargés (toponymes) par un sous-texte. Celle-ci interroge
    // n'importe quel lemme du dictionnaire et bascule la carte sur SES
    // villages témoins — qui n'ont souvent rien à voir avec le toponyme du
    // même nom.
    const [motSaisi, setMotSaisi] = useState("")
    const [requeteMot, setRequeteMot] = useState("")
    const [motActif, setMotActif] = useState<LemmeResume | null>(null)

    useEffect(() => {
        const saisie = motSaisi.trim()
        if (saisie.length < 2) {
            setRequeteMot("")
            return
        }
        const minuteur = setTimeout(() => setRequeteMot(saisie), 250)
        return () => clearTimeout(minuteur)
    }, [motSaisi])

    const cleSuggestions = requeteMot.length >= 2 ? cleCache("carte-suggestions", requeteMot) : null
    const { donnees: suggestions } = useListeMemorisee<LemmeResume[]>({
        cle: cleSuggestions,
        charger: () => rechercherAction(requeteMot),
    })
    const afficherSuggestions = cleSuggestions !== null && !motActif

    const clePointsMot = motActif ? cleCache("carte-mot", motActif.id) : null
    const { donnees: pointsMot, premierChargement: motEnChargement } = useListeMemorisee<PointsMot | null>({
        cle: clePointsMot,
        charger: () => pointsMotAction(motActif!.id),
    })

    function choisirMot(lemme: LemmeResume) {
        setMotActif(lemme)
        setMotSaisi("")
        setRequeteMot("")
    }

    function revenirALaCarteDesVillages() {
        setMotActif(null)
        setMotSaisi("")
        setRequeteMot("")
    }

    const filtres = useMemo(() => {
        const t = terme.trim().toLowerCase()
        if (!t) return points
        return points.filter((p) =>
            p.nom.toLowerCase().includes(t)
            || p.formes.some((f) => f.toLowerCase().includes(t)))
    }, [points, terme])

    const pointsAffiches: PointParler[] = motActif ? (pointsMot?.points ?? []) : filtres

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

            <div className="relative space-y-1">
                <label className="text-sm font-medium">Chercher un mot du dictionnaire</label>
                <input
                    value={motSaisi}
                    onChange={(e) => setMotSaisi(e.target.value)}
                    placeholder="bonjour, salaire, Colmar…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                    // `text-base` et non `text-sm` : en dessous de 16 px, iOS zoome
                    // sur le champ au focus et casse le cadrage de la carte.
                />
                {afficherSuggestions && (
                    <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background shadow-md">
                        {(suggestions ?? []).length === 0 ? (
                            <li className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat.</li>
                        ) : (
                            (suggestions ?? []).map((s) => (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        onClick={() => choisirMot(s)}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                    >
                                        {s.francais}
                                        {s.contexte ? <span className="text-muted-foreground"> — {s.contexte}</span> : null}
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>

            {motActif && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span>
                        Carte de « <strong>{motActif.francais}</strong> »
                        {motEnChargement ? " — chargement…" : null}
                    </span>
                    <button type="button" onClick={revenirALaCarteDesVillages} className="underline">
                        ◀ Retour à la carte des villages
                    </button>
                </div>
            )}

            {motActif && !motEnChargement && (pointsMot?.formesSansLieu.length ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground">
                    Personne n'a encore dit d'où vient : {pointsMot!.formesSansLieu.join(" · ")}.
                </p>
            )}

            {motActif && !motEnChargement && pointsMot && pointsMot.points.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    Aucun village n'a encore revendiqué une forme de « {motActif.francais} ».
                </p>
            )}

            {(premierChargement || (motActif && motEnChargement)) ? (
                <Cadre>Chargement…</Cadre>
            ) : (
                <CarteParlers
                    points={pointsAffiches}
                    couleurDe={couleurDeForme}
                    className="h-[70vh] w-full overflow-hidden rounded-lg border"
                />
            )}

            {!motActif && (
                <input
                    value={terme}
                    onChange={(e) => setTerme(e.target.value)}
                    placeholder="Filtrer les villages affichés, par nom ou par forme…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                />
            )}

            <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                    {pointsAffiches.length} point{pointsAffiches.length > 1 ? "s" : ""} affiché
                    {pointsAffiches.length > 1 ? "s" : ""}.
                </span>
                {/* La mention de paternité exigée par la Licence Ouverte vit ici
                    plutôt que sur la carte : le texte de la licence n'impose
                    aucun emplacement, et accepte même un simple renvoi. */}
                <Link href="/sources" className="underline">Sources</Link>
            </p>
        </main>
    )
}

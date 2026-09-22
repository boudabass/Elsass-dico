"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useMemo, useState } from "react"

import { pointsCarteAction, pointsMotAction, type PointsCarte, type PointsMot } from "@/app/actions/carte"
import { rechercherAction } from "@/app/actions/recherche"
import { AppHeader } from "@/components/app-header"
import type { PointParler } from "@/components/carte-parlers"
import { ChampSuggestions } from "@/components/champ-suggestions"
import { useListeMemorisee } from "@/hooks/use-liste-memorisee"
import { useRequeteDebattue } from "@/hooks/use-requete-debattue"
import { cleCache } from "@/lib/cache-navigation"
import { couleurDeForme } from "@/lib/couleur-carte"
import type { LemmeResume } from "@/lib/dictionnaire"

import { AideCarte } from "./aide-carte"
import { PanneauContribution } from "./panneau-contribution"

// `ssr: false` parce que Leaflet lit `window` à l'import : sans ça, le build
// échoue au prérendu de la page.
const CarteParlers = dynamic(
    () => import("@/components/carte-parlers").then((m) => m.CarteParlers),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                Chargement de la carte…
            </div>
        ),
    },
)

// Une seule référence pour « rien à afficher » : un `[]` neuf à chaque rendu
// ferait redessiner les marqueurs pour rien.
const AUCUN_POINT: PointParler[] = []

export function CarteDemo() {
    const { donnees, premierChargement } = useListeMemorisee<PointsCarte>({
        // Donnée publique, la même pour tout le monde : pas de segment
        // d'identité dans la clé, contrairement aux listes propres à un
        // membre (`admin-membres`, `mon-espace`).
        cle: cleCache("carte-parlers"),
        charger: pointsCarteAction,
    })

    // --- Recherche d'un mot quelconque (doc 20, étape 4) --------------------
    //
    // Distincte du filtre des villages plus bas : celui-ci ne fait que réduire
    // les points déjà chargés (toponymes) par un sous-texte. Celle-ci interroge
    // n'importe quel lemme du dictionnaire et bascule la carte sur SES
    // villages témoins — qui n'ont souvent rien à voir avec le toponyme du
    // même nom.
    const [motSaisi, setMotSaisi] = useState("")
    const [motActif, setMotActif] = useState<LemmeResume | null>(null)
    const requeteMot = useRequeteDebattue(motSaisi)

    const cleSuggestions = requeteMot ? cleCache("carte-suggestions", requeteMot) : null
    const { donnees: suggestions } = useListeMemorisee<LemmeResume[]>({
        cle: cleSuggestions,
        charger: () => rechercherAction(requeteMot),
    })

    const {
        donnees: pointsMot,
        premierChargement: motEnChargement,
        rafraichir: rafraichirMot,
    } = useListeMemorisee<PointsMot | null>({
        cle: motActif ? cleCache("carte-mot", motActif.id) : null,
        charger: () => pointsMotAction(motActif!.id),
    })

    function choisirMot(lemme: LemmeResume) {
        setMotActif(lemme)
        setMotSaisi("")
    }

    // Retaper dans le champ quitte le mot affiché, comme le bouton ×.
    function saisirMot(valeur: string) {
        setMotSaisi(valeur)
        setMotActif(null)
    }

    // Pas de débounce : filtrer quelques centaines de points en mémoire ne
    // coûte rien, et la carte ne redessine que ses marqueurs.
    const [filtre, setFiltre] = useState("")
    const villages = donnees?.points ?? AUCUN_POINT
    const villagesFiltres = useMemo(() => {
        const t = filtre.trim().toLowerCase()
        if (!t) return villages
        return villages.filter((p) =>
            p.nom.toLowerCase().includes(t)
            || p.formes.some((f) => f.toLowerCase().includes(t)))
    }, [villages, filtre])

    const pointsAffiches = motActif ? (pointsMot?.points ?? AUCUN_POINT) : villagesFiltres
    const enChargement = motActif ? motEnChargement : premierChargement

    return (
        // `overflow-hidden` : filet de sécurité. Le panneau de contribution a
        // son propre défilement ; sans cette ligne, un débordement de `main`
        // remonterait quand même en scroll de PAGE.
        <div className="flex h-dvh flex-col overflow-hidden md:pl-20 lg:pl-56">
            <div className="shrink-0">
                <AppHeader variant="root" actif="carte" titre="Carte des parlers" />
            </div>

            {/* `min-h-0` : sans ça un enfant flex ne rétrécit jamais sous sa
                hauteur de contenu, et la carte pousserait la page en scroll
                au lieu de céder sa place. */}
            <main className="flex min-h-0 flex-1 flex-col gap-2 p-4 pb-16 md:pb-4">
                <div className="flex shrink-0 items-start gap-2">
                    <ChampSuggestions
                        label="Chercher un mot du dictionnaire"
                        valeur={motSaisi}
                        onValeurChange={saisirMot}
                        placeholder="Chercher un mot : bonjour, salaire, Colmar…"
                        actif={cleSuggestions !== null}
                        suggestions={suggestions}
                        cleDe={(s) => String(s.id)}
                        rendre={(s) => (
                            <>
                                {s.francais}
                                {s.contexte ? <span className="text-muted-foreground"> — {s.contexte}</span> : null}
                            </>
                        )}
                        onChoisir={choisirMot}
                        inputClassName="pr-9"
                        className="min-w-0 flex-1"
                        ornement={motActif && (
                            <button
                                type="button"
                                onClick={() => saisirMot("")}
                                aria-label="Revenir à la carte des villages"
                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                            >
                                ×
                            </button>
                        )}
                    />
                    <AideCarte />
                </div>

                {motActif && (
                    <PanneauContribution
                        lemmeId={motActif.id}
                        francais={motActif.francais}
                        variantes={motEnChargement ? null : (pointsMot?.variantes ?? [])}
                        onSucces={rafraichirMot}
                    />
                )}

                {/* La carte reste montée d'un mode à l'autre : le chargement se
                    superpose, il ne la remplace pas — sinon elle se
                    reconstruirait et perdrait le cadrage du membre. */}
                <div className="relative min-h-0 flex-1">
                    <CarteParlers
                        points={pointsAffiches}
                        couleurDe={couleurDeForme}
                        className="h-full w-full overflow-hidden rounded-lg border"
                    />
                    {enChargement && (
                        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                                Chargement…
                            </span>
                        </div>
                    )}
                </div>

                {!motActif && (
                    <input
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        aria-label="Filtrer les villages affichés"
                        placeholder="Filtrer les villages affichés, par nom ou par forme…"
                        className="w-full shrink-0 rounded-md border border-input bg-background px-3 py-2 text-base"
                    />
                )}

                <p className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
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
        </div>
    )
}

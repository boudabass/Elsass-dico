"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

import {
    pointsCarteAction,
    pointsFormeAction,
    pointsMotAction,
    type PointsCarte,
    type PointsForme,
    type PointsMot,
} from "@/app/actions/carte"
import { rechercherFormesAction } from "@/app/actions/formes"
import { rechercherAction } from "@/app/actions/recherche"
import { AppHeader } from "@/components/app-header"
import type { PointParler } from "@/components/carte-parlers"
import { ChampSuggestions } from "@/components/champ-suggestions"
import { EchecChargement } from "@/components/echec-chargement"
import { useSens } from "@/components/sens-provider"
import { useListeMemorisee } from "@/hooks/use-liste-memorisee"
import { useRequeteDebattue } from "@/hooks/use-requete-debattue"
import { cleCache } from "@/lib/cache-navigation"
import { couleurParRang } from "@/lib/couleur-carte"
import { entreParentheses, precisionLemme, type FormeResume, type LemmeResume } from "@/lib/dictionnaire"

import { AideCarte } from "./aide-carte"
import { PanneauContribution } from "./panneau-contribution"
import { PanneauForme } from "./panneau-forme"

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

// Une suggestion du champ de recherche, dans l'un ou l'autre sens
// (27/09/2026) : un mot français, ou une forme alsacienne.
type Suggestion =
    | { cle: string; lemme: LemmeResume; forme?: undefined }
    | { cle: string; forme: FormeResume; lemme?: undefined }

export function CarteDemo() {
    const { donnees, premierChargement, echec: echecVillages, rafraichir: rechargerVillages } = useListeMemorisee<PointsCarte>({
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
    //
    // Le sens de l'inverseur (27/09/2026) choisit ce qu'on cherche : un mot
    // français, dont on voit les formes, ou une forme alsacienne, dont on voit
    // les sens. `motActif` et `formeActive` ne coexistent jamais.
    const { sens } = useSens()
    const [motSaisi, setMotSaisi] = useState("")
    const [motActif, setMotActif] = useState<LemmeResume | null>(null)
    const [formeActive, setFormeActive] = useState<FormeResume | null>(null)
    const requeteMot = useRequeteDebattue(motSaisi)

    const cleSuggestions = requeteMot ? cleCache("carte-suggestions", sens, requeteMot) : null
    const { donnees: suggestions } = useListeMemorisee<Suggestion[]>({
        cle: cleSuggestions,
        charger: async (): Promise<Suggestion[]> =>
            sens === "als"
                ? (await rechercherFormesAction(requeteMot)).map((f) => ({ cle: f.cle, forme: f }))
                : (await rechercherAction(requeteMot)).map((l) => ({ cle: l.id, lemme: l })),
    })

    const {
        donnees: pointsForme,
        premierChargement: formeEnChargement,
        echec: echecForme,
        rafraichir: rafraichirForme,
    } = useListeMemorisee<PointsForme | null>({
        cle: formeActive ? cleCache("carte-forme", formeActive.cle) : null,
        charger: () => pointsFormeAction(formeActive!.cle),
    })

    const {
        donnees: pointsMot,
        premierChargement: motEnChargement,
        echec: echecMot,
        rafraichir: rafraichirMot,
    } = useListeMemorisee<PointsMot | null>({
        cle: motActif ? cleCache("carte-mot", motActif.id) : null,
        charger: () => pointsMotAction(motActif!.id),
    })

    const urlANettoyer = useRef(false)

    // Lien direct vers la carte d'un mot (`/carte?mot=<id>`), posé par le
    // premier parcours de « Mon espace » (24/09/2026) : juste après son premier
    // vote, le membre voit son village sur la carte de ce mot. Lu une fois au
    // montage, puis retiré de l'URL : revenir aux villages avec × ne doit pas
    // rouvrir le mot au prochain rechargement. Le libellé arrive avec les
    // points du mot, d'où `francais` vide en attendant.
    //
    // `?forme=<cle>&titre=<titre>` fait de même pour une forme alsacienne,
    // depuis sa fiche (revue du 28/09/2026).
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const id = params.get("mot")
        const cle = params.get("forme")
        if (id) {
            setMotActif({ id, francais: "", contexte: "", type: "mot", departement: null, formes: [], nbFormes: 0 })
        } else if (cle) {
            setFormeActive({ cle, titre: params.get("titre") ?? cle, sens: [], nbSens: 0 })
        } else {
            return
        }
        urlANettoyer.current = true
    }, [])

    // Le paramètre ne quitte l'URL qu'une fois le mot ou la forme chargés :
    // `replaceState` abandonne une Server Action en vol, et la carte restait
    // alors sur « Chargement… » jusqu'à la reprise (8 s). Cf. le piège du
    // 27/09/2026 : réécrire l'URL après, jamais pendant.
    useEffect(() => {
        if (!urlANettoyer.current) return
        if (!pointsMot && !pointsForme && (motActif || formeActive)) return
        urlANettoyer.current = false
        window.history.replaceState(null, "", window.location.pathname)
    }, [pointsMot, pointsForme, motActif, formeActive])

    function choisir(s: Suggestion) {
        if (s.lemme) setMotActif(s.lemme)
        else setFormeActive(s.forme)
        setMotSaisi("")
    }

    // Retaper dans le champ quitte le mot affiché, comme le bouton ×.
    function saisirMot(valeur: string) {
        setMotSaisi(valeur)
        setMotActif(null)
        setFormeActive(null)
    }

    // Retourner le livre ramène à la carte des villages : un mot français
    // affiché n'a plus de sens une fois qu'on cherche depuis l'alsacien.
    // La carte, elle, reste montée et garde son cadrage.
    const sensPrecedent = useRef(sens)
    useEffect(() => {
        if (sensPrecedent.current === sens) return
        sensPrecedent.current = sens
        saisirMot("")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sens])

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

    const pointsAffiches = formeActive
        ? (pointsForme?.points ?? AUCUN_POINT)
        : motActif
            ? (pointsMot?.points ?? AUCUN_POINT)
            : villagesFiltres
    const enChargement = formeActive ? formeEnChargement : motActif ? motEnChargement : premierChargement
    const selection = motActif ?? formeActive
    const echec = formeActive ? echecForme : motActif ? echecMot : echecVillages
    const recharger = formeActive ? rafraichirForme : motActif ? rafraichirMot : rechargerVillages

    // Une couleur par variante (ou par sens), dans l'ordre du panneau, qui sert
    // de légende. Sans recherche, `undefined` : tous les villages d'une couleur.
    const cles = formeActive
        ? (pointsForme?.sens ?? []).map((s) => s.francais)
        : motActif
            ? (pointsMot?.variantes ?? []).map((v) => v.forme)
            : null
    const cleCouleurs = cles ? JSON.stringify(cles) : null
    const couleurDe = useMemo(() => {
        if (cleCouleurs === null) return undefined
        const rangs = new Map<string, number>()
        for (const c of JSON.parse(cleCouleurs) as string[]) if (!rangs.has(c)) rangs.set(c, rangs.size)
        return (cle: string) => couleurParRang(rangs.get(cle) ?? 0)
    }, [cleCouleurs])

    return (
        // `overflow-hidden` : filet de sécurité. Le panneau de contribution a
        // son propre défilement ; sans cette ligne, un débordement de `main`
        // remonterait quand même en scroll de PAGE.
        <div className="flex h-[calc(100dvh-var(--hauteur-inverseur))] flex-col overflow-hidden md:pl-20 lg:pl-56">
            <div className="shrink-0">
                <AppHeader variant="root" actif="carte" titre="Carte des parlers" />
            </div>

            {/* `min-h-0` : sans ça un enfant flex ne rétrécit jamais sous sa
                hauteur de contenu, et la carte pousserait la page en scroll
                au lieu de céder sa place. */}
            <main className="flex min-h-0 flex-1 flex-col gap-2 p-4 pb-16 md:pb-4">
                <div className="flex shrink-0 items-start gap-2">
                    <ChampSuggestions
                        label={sens === "als" ? "Chercher une forme alsacienne" : "Chercher un mot français"}
                        valeur={motSaisi}
                        onValeurChange={saisirMot}
                        placeholder={sens === "als" ? "Une forme : buschur, Lohn…" : "Un mot : bonjour, salaire…"}
                        actif={cleSuggestions !== null}
                        suggestions={suggestions}
                        cleDe={(s) => s.cle}
                        rendre={(s) =>
                            s.lemme ? (
                                <>
                                    {s.lemme.francais}
                                    {precisionLemme(s.lemme) ? <span className="ml-1 text-muted-foreground">{entreParentheses(precisionLemme(s.lemme))}</span> : null}
                                </>
                            ) : (
                                <>
                                    {s.forme.titre}
                                    {s.forme.sens[0] && (
                                        <span className="ml-1 text-muted-foreground">
                                            ({s.forme.sens[0].francais}{s.forme.nbSens > 1 ? `, +${s.forme.nbSens - 1}` : ""})
                                        </span>
                                    )}
                                </>
                            )
                        }
                        onChoisir={choisir}
                        inputClassName="pr-9"
                        className="min-w-0 flex-1"
                        ornement={selection && (
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

                {formeActive && (
                    <PanneauForme
                        titre={formeActive.titre}
                        sens={formeEnChargement ? null : (pointsForme?.sens ?? [])}
                        couleurDe={couleurDe}
                        onSucces={rafraichirForme}
                    />
                )}

                {motActif && (
                    <PanneauContribution
                        lemmeId={motActif.id}
                        francais={motActif.francais || pointsMot?.francais || ""}
                        variantes={motEnChargement ? null : (pointsMot?.variantes ?? [])}
                        couleurDe={couleurDe}
                        onSucces={rafraichirMot}
                    />
                )}

                {/* La carte reste montée d'un mode à l'autre : le chargement se
                    superpose, il ne la remplace pas — sinon elle se
                    reconstruirait et perdrait le cadrage du membre. */}
                <div className="relative min-h-0 flex-1">
                    <CarteParlers
                        points={pointsAffiches}
                        couleurDe={couleurDe}
                        className="h-full w-full overflow-hidden rounded-lg border"
                    />
                    {echec && (
                        <div className="absolute inset-x-3 top-3 z-[1001] mx-auto max-w-sm rounded-lg border bg-background shadow-md">
                            <EchecChargement onReessayer={recharger} />
                        </div>
                    )}
                    {enChargement && (
                        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                                Chargement…
                            </span>
                        </div>
                    )}
                </div>

                {!selection && (
                    <input
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        aria-label="Filtrer les villages affichés"
                        placeholder="Filtrer par village ou par forme…"
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

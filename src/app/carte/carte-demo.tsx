"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { pointsCarteAction, pointsMotAction, type PointsCarte, type PointsMot } from "@/app/actions/carte"
import { rechercherAction } from "@/app/actions/recherche"
import { NouvelleVariante } from "@/app/entree/[id]/nouvelle-variante"
import { VoteVariante } from "@/app/entree/[id]/vote-variante"
import { AppHeader } from "@/components/app-header"
import type { PointParler } from "@/components/carte-parlers"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
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
        <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
            {children}
        </div>
    )
}

export function CarteDemo() {
    const [terme, setTerme] = useState("")
    const [termeDebattu, setTermeDebattu] = useState("")
    const [aideOuverte, setAideOuverte] = useState(false)

    // Même patron que le débounce de la recherche de mot ci-dessous (250ms) :
    // sans lui, chaque frappe recalculait `filtres` (nouvelle référence de
    // tableau), ce qui forçait `CarteParlers` (effet dépendant de `points`)
    // à détruire et reconstruire toute la carte Leaflet à chaque caractère.
    useEffect(() => {
        const minuteur = setTimeout(() => setTermeDebattu(terme), 250)
        return () => clearTimeout(minuteur)
    }, [terme])

    const { donnees, premierChargement } = useListeMemorisee<PointsCarte>({
        // Donnée publique, la même pour tout le monde : pas de segment
        // d'identité dans la clé, contrairement aux listes propres à un
        // membre (`admin-membres`, `mon-espace`).
        cle: cleCache("carte-parlers"),
        charger: pointsCarteAction,
    })

    const points: PointParler[] = donnees?.points ?? []

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
    // `afficherSuggestions` est dérivé du cache seul — sans cet état de
    // fermeture explicite, un Popover contrôlé se rouvrirait aussitôt après
    // une fermeture manuelle (Échap, clic extérieur), puisque la clé de
    // cache ne change pas pour autant.
    const [suggestionsFermees, setSuggestionsFermees] = useState(false)

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
    const popoverMotOuvert = cleSuggestions !== null && !motActif && !suggestionsFermees

    const clePointsMot = motActif ? cleCache("carte-mot", motActif.id) : null
    const {
        donnees: pointsMot,
        premierChargement: motEnChargement,
        rafraichir: rafraichirMot,
    } = useListeMemorisee<PointsMot | null>({
        cle: clePointsMot,
        charger: () => pointsMotAction(motActif!.id),
    })

    function choisirMot(lemme: LemmeResume) {
        setMotActif(lemme)
        setMotSaisi("")
        setRequeteMot("")
        setSuggestionsFermees(false)
    }

    function revenirALaCarteDesVillages() {
        setMotActif(null)
        setMotSaisi("")
        setRequeteMot("")
    }

    const filtres = useMemo(() => {
        const t = termeDebattu.trim().toLowerCase()
        if (!t) return points
        return points.filter((p) =>
            p.nom.toLowerCase().includes(t)
            || p.formes.some((f) => f.toLowerCase().includes(t)))
    }, [points, termeDebattu])

    const pointsAffiches: PointParler[] = motActif ? (pointsMot?.points ?? []) : filtres

    return (
        // `Dialog` englobe tout l'écran : `DialogPrimitive.Root` ne rend aucun
        // DOM lui-même, donc ça ne perturbe pas la mise en page flex ci-dessous.
        <Dialog open={aideOuverte} onOpenChange={setAideOuverte}>
            {/* `overflow-hidden` : filet de sécurité — si le panneau de contribution
                grossit sur un petit écran (beaucoup de variantes), il a déjà son
                propre défilement interne (`overflow-y-auto` plus bas) ; sans cette
                ligne, un débordement de `main` remonterait quand même en scroll de
                PAGE, exactement ce qu'on cherche à supprimer. */}
            <div className="flex h-dvh flex-col overflow-hidden md:pl-20 lg:pl-56">
            <div className="shrink-0">
                <AppHeader variant="root" actif="carte" titre="Carte des parlers" />
            </div>

            {/* `min-h-0` : sans ça un enfant flex ne rétrécit jamais sous sa
                hauteur de contenu, et la carte pousserait la page en scroll
                au lieu de céder sa place — exactement ce qu'on veut éviter. */}
            <main className="flex min-h-0 flex-1 flex-col gap-2 p-4 pb-16 md:pb-4">
                <div className="flex shrink-0 items-start gap-2">
                    {/* Pas de `space-y-*` ici : le label est `sr-only` (donc
                        `position: absolute`, retiré du flux), mais `space-y-*`
                        ajoute quand même une marge-top à l'élément suivant sur
                        la seule base de l'ordre des enfants dans le DOM — c'est
                        ce qui décalait la barre de recherche vers le bas par
                        rapport au bouton « ? ». */}
                    <Command
                        shouldFilter={false}
                        // cf. recherche-accueil.tsx : cmdk gère son propre id
                        // interne pour l'input, un `<label htmlFor>` manuel se
                        // retrouverait orphelin — `label` est le mécanisme
                        // prévu par cmdk pour un libellé accessible non affiché.
                        label="Chercher un mot du dictionnaire"
                        className="relative min-w-0 flex-1 overflow-visible bg-transparent"
                    >
                        <Popover
                            open={popoverMotOuvert}
                            onOpenChange={(o) => { if (!o) setSuggestionsFermees(true) }}
                        >
                            <PopoverAnchor asChild>
                                <div className="relative">
                                    <CommandInput
                                        value={motSaisi}
                                        // Retaper efface directement le mot déjà actif : sans
                                        // ça, `popoverMotOuvert` restait bloqué (`!motActif`)
                                        // tant qu'on n'avait pas cliqué le × de retour.
                                        onValueChange={(v) => { setMotSaisi(v); setSuggestionsFermees(false); setMotActif(null) }}
                                        placeholder="Chercher un mot : bonjour, salaire, Colmar…"
                                        wrapperClassName=""
                                        showIcon={false}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-base"
                                        // `text-base` et non `text-sm` : en dessous de 16 px, iOS
                                        // zoome sur le champ au focus et casse le cadrage de la carte.
                                    />
                                    {motActif && (
                                        <button
                                            type="button"
                                            onClick={revenirALaCarteDesVillages}
                                            aria-label="Revenir à la carte des villages"
                                            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </PopoverAnchor>
                            <PopoverContent
                                align="start"
                                sideOffset={4}
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onCloseAutoFocus={(e) => e.preventDefault()}
                                className="w-[--radix-popover-trigger-width] rounded-md p-0 shadow-md"
                            >
                                <CommandList className="max-h-64">
                                    <CommandEmpty className="px-3 py-2 text-left text-sm text-muted-foreground">
                                        Aucun résultat.
                                    </CommandEmpty>
                                    {(suggestions ?? []).map((s) => (
                                        <CommandItem
                                            key={s.id}
                                            value={String(s.id)}
                                            onSelect={() => choisirMot(s)}
                                            className="w-full cursor-pointer justify-start gap-0 rounded-none px-3 py-2 text-left text-sm data-[selected=true]:bg-muted"
                                        >
                                            {s.francais}
                                            {s.contexte ? <span className="text-muted-foreground"> — {s.contexte}</span> : null}
                                        </CommandItem>
                                    ))}
                                </CommandList>
                            </PopoverContent>
                        </Popover>
                    </Command>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            aria-label="Comment lire cette carte"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background text-sm font-semibold text-foreground hover:bg-muted"
                        >
                            ?
                        </button>
                    </DialogTrigger>
                </div>

                {motActif && (
                    // À la place de l'ancien texte « Retour à la carte des villages » :
                    // ajouter directement son village à une forme existante, ou en
                    // apporter une nouvelle — sans quitter la carte. `max-h` + scroll
                    // interne plutôt que de repousser la carte : un mot à beaucoup de
                    // variantes ne doit jamais faire défiler la page entière.
                    <div className="max-h-[32vh] shrink-0 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium text-foreground">
                            « {motActif.francais} »
                            {motEnChargement ? " — chargement…" : null}
                        </p>

                        {!motEnChargement && (pointsMot?.variantes.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {pointsMot!.variantes.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center gap-1.5 rounded-full border border-bordure-forte py-1 pl-3 pr-1.5 text-xs text-foreground"
                                    >
                                        <span>{v.forme}</span>
                                        <VoteVariante varianteId={v.id} monVote={v.monVote} onSucces={rafraichirMot} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!motEnChargement && (
                            <NouvelleVariante lemmeId={motActif.id} onSucces={rafraichirMot} />
                        )}
                    </div>
                )}

                <div className="min-h-0 flex-1">
                    {(premierChargement || (motActif && motEnChargement)) ? (
                        <Cadre>Chargement…</Cadre>
                    ) : (
                        <CarteParlers
                            points={pointsAffiches}
                            couleurDe={couleurDeForme}
                            className="h-full w-full overflow-hidden rounded-lg border"
                        />
                    )}
                </div>

                {!motActif && (
                    <input
                        value={terme}
                        onChange={(e) => setTerme(e.target.value)}
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

            <DialogContent className="max-w-md gap-3 p-5">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-foreground">
                        Comment lire cette carte
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            Sans recherche, chaque point est un village : sa couleur suit la
                            première forme qu'on lui connaît pour son propre nom.
                        </p>
                        <p>
                            En cherchant un mot, chaque point devient une variante de ce mot —
                            une couleur par variante, aux villages qui la revendiquent.
                        </p>
                        <p>
                            Clique un point pour voir le détail. « + Chez moi aussi » et
                            « Ça se dit autrement chez moi » ajoutent directement ton village.
                        </p>
                    </div>
                </DialogDescription>
            </DialogContent>
            </div>
        </Dialog>
    )
}

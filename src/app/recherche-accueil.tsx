"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { rechercherAccueilAction, type SuggestionAccueil } from "@/app/actions/accueil"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useListeMemorisee } from "@/hooks/use-liste-memorisee"
import { cleCache } from "@/lib/cache-navigation"

// Recherche interactive de la home publique (18/09/2026, retour de John) :
// même patron debounce + suggestions que `carte-demo.tsx` (250 ms,
// useListeMemorisee), mais restreinte aux deux collections déjà publiques
// sans compte — chaque résultat mène à une vraie fiche, jamais à `/login`.
export function RechercheAccueil() {
    const [terme, setTerme] = useState("")
    const [requete, setRequete] = useState("")
    // Cf. carte-demo.tsx : `afficherSuggestions` dérivé du cache seul ne
    // suffit pas à un Popover contrôlé, qui se rouvrirait aussitôt après une
    // fermeture manuelle (Échap, clic extérieur) sans cet état explicite.
    const [suggestionsFermees, setSuggestionsFermees] = useState(false)

    useEffect(() => {
        const saisie = terme.trim()
        if (saisie.length < 2) {
            setRequete("")
            return
        }
        const minuteur = setTimeout(() => setRequete(saisie), 250)
        return () => clearTimeout(minuteur)
    }, [terme])

    const cle = requete.length >= 2 ? cleCache("accueil-recherche", requete) : null
    const { donnees: suggestions } = useListeMemorisee<SuggestionAccueil[]>({
        cle,
        charger: () => rechercherAccueilAction(requete),
    })
    const popoverOuvert = cle !== null && !suggestionsFermees

    return (
        <Command shouldFilter={false} className="w-full max-w-sm overflow-visible bg-transparent">
            <Popover
                open={popoverOuvert}
                onOpenChange={(o) => { if (!o) setSuggestionsFermees(true) }}
            >
                <PopoverAnchor asChild>
                    <div className="relative w-full text-left">
                        <label htmlFor="accueil-recherche" className="sr-only">
                            Chercher un village ou un prénom
                        </label>
                        <CommandInput
                            id="accueil-recherche"
                            value={terme}
                            onValueChange={(v) => { setTerme(v); setSuggestionsFermees(false) }}
                            placeholder="Un village, un prénom…"
                            autoComplete="off"
                            wrapperClassName=""
                            showIcon={false}
                            className="h-12 w-full rounded-lg border border-input bg-background px-3.5 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </PopoverAnchor>
                <PopoverContent
                    align="start"
                    sideOffset={6}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="w-[--radix-popover-trigger-width] rounded-lg p-0 shadow-md"
                >
                    <CommandList className="max-h-64">
                        <CommandEmpty className="px-3.5 py-2.5 text-left text-sm text-muted-foreground">
                            Aucun résultat.
                        </CommandEmpty>
                        {(suggestions ?? []).map((s) => (
                            <CommandItem
                                key={`${s.type}-${s.slug}`}
                                value={`${s.type}-${s.slug}`}
                                asChild
                                className="gap-0 rounded-none p-0"
                            >
                                <Link
                                    href={s.type === "village" ? `/village/${s.slug}` : `/prenom/${s.slug}`}
                                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-sm outline-none transition-colors hover:bg-neutre-100 focus-visible:bg-neutre-100 data-[selected=true]:bg-neutre-100"
                                >
                                    <span className="font-medium text-foreground">{s.label}</span>
                                    {s.sousLabel && (
                                        <span className="text-xs text-muted-foreground">{s.sousLabel}</span>
                                    )}
                                </Link>
                            </CommandItem>
                        ))}
                    </CommandList>
                </PopoverContent>
            </Popover>
        </Command>
    )
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { rechercherAccueilAction, type SuggestionAccueil } from "@/app/actions/accueil"
import { useListeMemorisee } from "@/hooks/use-liste-memorisee"
import { cleCache } from "@/lib/cache-navigation"

// Recherche interactive de la home publique (18/09/2026, retour de John) :
// même patron debounce + suggestions que `carte-demo.tsx` (250 ms,
// useListeMemorisee), mais restreinte aux deux collections déjà publiques
// sans compte — chaque résultat mène à une vraie fiche, jamais à `/login`.
export function RechercheAccueil() {
    const [terme, setTerme] = useState("")
    const [requete, setRequete] = useState("")

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
    const afficherSuggestions = cle !== null

    return (
        <div className="relative w-full max-w-sm text-left">
            <label htmlFor="accueil-recherche" className="sr-only">
                Chercher un village ou un prénom
            </label>
            <input
                id="accueil-recherche"
                value={terme}
                onChange={(e) => setTerme(e.target.value)}
                placeholder="Un village, un prénom…"
                autoComplete="off"
                className="h-12 w-full rounded-lg border border-input bg-background px-3.5 text-base outline-none placeholder:text-neutre-400 focus-visible:ring-2 focus-visible:ring-ring"
            />
            {afficherSuggestions && (
                <ul className="absolute z-10 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-md">
                    {(suggestions ?? []).length === 0 ? (
                        <li className="px-3.5 py-2.5 text-sm text-muted-foreground">Aucun résultat.</li>
                    ) : (
                        (suggestions ?? []).map((s) => (
                            <li key={`${s.type}-${s.slug}`}>
                                <Link
                                    href={s.type === "village" ? `/village/${s.slug}` : `/prenom/${s.slug}`}
                                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm outline-none transition-colors hover:bg-neutre-100 focus-visible:bg-neutre-100"
                                >
                                    <span className="font-medium text-foreground">{s.label}</span>
                                    {s.sousLabel && (
                                        <span className="text-xs text-neutre-400">{s.sousLabel}</span>
                                    )}
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    )
}

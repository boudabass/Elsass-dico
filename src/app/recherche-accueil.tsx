"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { rechercherAccueilAction, type SuggestionAccueil } from "@/app/actions/accueil"
import { ChampSuggestions } from "@/components/champ-suggestions"
import { useListeMemorisee } from "@/hooks/use-liste-memorisee"
import { useRequeteDebattue } from "@/hooks/use-requete-debattue"
import { cleCache } from "@/lib/cache-navigation"

// Recherche interactive de la home publique (18/09/2026, retour de John),
// restreinte aux deux collections déjà publiques sans compte : chaque
// résultat mène à une vraie fiche, jamais à `/login`.
export function RechercheAccueil() {
    const router = useRouter()
    const [terme, setTerme] = useState("")
    const requete = useRequeteDebattue(terme)

    const cle = requete ? cleCache("accueil-recherche", requete) : null
    const { donnees: suggestions } = useListeMemorisee<SuggestionAccueil[]>({
        cle,
        charger: () => rechercherAccueilAction(requete),
    })

    return (
        <ChampSuggestions
            label="Chercher un village ou un prénom"
            valeur={terme}
            onValeurChange={setTerme}
            placeholder="Un village, un prénom…"
            actif={cle !== null}
            suggestions={suggestions}
            cleDe={(s) => `${s.type}-${s.slug}`}
            rendre={(s) => (
                <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{s.label}</span>
                    {s.sousLabel && <span className="text-xs text-muted-foreground">{s.sousLabel}</span>}
                </span>
            )}
            // Par le routeur et non par un `<Link>` : cmdk ne déclenche que
            // `onSelect` à l'Entrée, un lien n'aurait réagi qu'au clic.
            onChoisir={(s) => router.push(s.type === "village" ? `/village/${s.slug}` : `/prenom/${s.slug}`)}
            inputClassName="h-12 rounded-lg px-3.5"
            className="w-full max-w-sm text-left"
        />
    )
}

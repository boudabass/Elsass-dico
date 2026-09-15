"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { modifierVarianteAction } from "@/app/actions/variantes";

// Doc 20, « Correction » : l'auteur édite sa variante tant que personne
// d'autre ne l'a revendiquée. Fermé côté serveur (`modifierVarianteAction`),
// pas seulement caché ici — `v.modifiable` ne fait qu'éviter de montrer un
// bouton qui échouerait de toute façon.
export function EditerVariante({ varianteId, formeActuelle }: { varianteId: string; formeActuelle: string }) {
    const [enEdition, setEnEdition] = useState(false);
    const [forme, setForme] = useState(formeActuelle);
    const [enCours, demarrer] = useTransition();
    const router = useRouter();

    function annuler() {
        setEnEdition(false);
        setForme(formeActuelle);
    }

    function envoyer(e: React.FormEvent) {
        e.preventDefault();
        if (!forme.trim()) return;
        demarrer(async () => {
            const res = await modifierVarianteAction(varianteId, forme);
            if (res.succes) {
                toast.success("Forme modifiée.");
                setEnEdition(false);
                router.refresh();
            } else {
                toast.error(res.erreur);
            }
        });
    }

    if (!enEdition) {
        return (
            <button
                type="button"
                onClick={() => setEnEdition(true)}
                className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
                Modifier
            </button>
        );
    }

    return (
        <form onSubmit={envoyer} className="flex flex-1 min-w-[200px] gap-2">
            <input
                value={forme}
                onChange={(e) => setForme(e.target.value)}
                disabled={enCours}
                aria-label="Modifier la forme"
                // `text-base` : sous 16 px, iOS zoome sur le champ au focus.
                className="h-9 flex-1 min-w-0 rounded-md border border-input bg-background px-2.5 text-base text-foreground disabled:opacity-60"
            />
            <button
                type="submit"
                disabled={enCours || !forme.trim()}
                className="h-9 shrink-0 rounded-md bg-marque-rouge-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-50"
            >
                Enregistrer
            </button>
            <button
                type="button"
                onClick={annuler}
                disabled={enCours}
                className="h-9 shrink-0 rounded-md px-3 text-xs font-semibold text-muted-foreground"
            >
                Annuler
            </button>
        </form>
    );
}

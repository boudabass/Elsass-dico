"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { modifierVarianteAction } from "@/app/actions/variantes";
import {
    ChampForme,
    formeDeValeur,
    saisieDeValeur,
    valeurDepuis,
    type ValeurForme,
} from "@/components/contribution/champ-forme";

// Doc 20, « Correction » : l'auteur édite sa variante tant que personne
// d'autre ne l'a revendiquée. Fermé côté serveur (`modifierVarianteAction`),
// pas seulement caché ici — `v.modifiable` ne fait qu'éviter de montrer un
// bouton qui échouerait de toute façon.
//
// Même bloc « article + forme » que la feuille de contribution (28/09/2026) :
// une forme qui porte un article se corrige avec son article, sans quoi le
// CHECK de reconstruction refuserait l'enregistrement.

function valeurInitiale(forme: string, article: string | null, formeSansArticle: string | null): ValeurForme {
    if (article && formeSansArticle !== null) return { prefixe: article, autre: false, reste: formeSansArticle };
    return valeurDepuis(forme);
}

export function EditerVariante({
    varianteId,
    forme,
    article,
    formeSansArticle,
}: {
    varianteId: string;
    forme: string;
    article: string | null;
    formeSansArticle: string | null;
}) {
    const [enEdition, setEnEdition] = useState(false);
    const [valeur, setValeur] = useState(() => valeurInitiale(forme, article, formeSansArticle));
    const [enCours, demarrer] = useTransition();
    const router = useRouter();

    function annuler() {
        setEnEdition(false);
        setValeur(valeurInitiale(forme, article, formeSansArticle));
    }

    function envoyer(e: React.FormEvent) {
        e.preventDefault();
        if (!formeDeValeur(valeur)) return;
        demarrer(async () => {
            const res = await modifierVarianteAction(varianteId, saisieDeValeur(valeur));
            if (res.succes) {
                toast.success("Forme modifiée");
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
        <form onSubmit={envoyer} className="flex w-full flex-col gap-2.5">
            <ChampForme valeur={valeur} onChange={setValeur} desactive={enCours} autoFocus compact />
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={enCours || !formeDeValeur(valeur)}
                    className="h-9 shrink-0 rounded-md bg-sens-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-sens-600 disabled:opacity-50"
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
            </div>
        </form>
    );
}

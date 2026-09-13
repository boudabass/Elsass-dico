"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { listerCommunesAction, type CommuneOption } from "@/app/actions/communes";
import { definirVillageAction } from "@/app/actions/membres";

// Doc 20, étape 5 : « profil sans village → une modale le demande une fois, et
// le mémorise ». Posé ici en ligne plutôt qu'en modale — la carte de « Mon
// espace » qui l'entoure ne s'affiche déjà que tant que le village manque, ce
// qui revient à ne le demander qu'une fois sans ouvrir un second écran.
//
// « Choisi dans une liste, jamais détecté » (doc 20) : aucune géolocalisation,
// un menu déroulant sur les 1 605 communes du référentiel.
export function SelecteurVillage({ onDefini }: { onDefini: () => void }) {
    const [communes, setCommunes] = useState<CommuneOption[] | null>(null);
    const [choix, setChoix] = useState("");
    const [enCours, demarrer] = useTransition();

    useEffect(() => {
        listerCommunesAction().then(setCommunes);
    }, []);

    function valider() {
        const communeId = Number(choix);
        if (!communeId) return;
        demarrer(async () => {
            const res = await definirVillageAction(communeId);
            if (res.succes) {
                toast.success(res.message);
                onDefini();
            } else {
                toast.error(res.erreur);
            }
        });
    }

    return (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
                value={choix}
                onChange={(e) => setChoix(e.target.value)}
                disabled={!communes}
                aria-label="Choisir un village"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
                <option value="">{communes ? "Choisir un village…" : "Chargement…"}</option>
                {communes?.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.nom} ({c.departement})
                    </option>
                ))}
            </select>
            <button
                type="button"
                onClick={valider}
                disabled={!choix || enCours}
                className="h-10 shrink-0 rounded-md bg-marque-rouge-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-50"
            >
                Valider
            </button>
        </div>
    );
}

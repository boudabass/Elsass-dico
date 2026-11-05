"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { enregistrerNomAction } from "@/app/actions/nom";
import { decouperNom } from "@/lib/nom";
import { cn } from "@/lib/utils";

// Le prénom et le nom que le membre choisit pour ses textes (04/11/2026).
// Pré-remplis avec le nom enregistré, qui vient d'Odoo tant que le membre ne l'a
// pas confirmé. Confirmer ne se fait qu'ici, et une connexion ne le réécrit pas.
export function NomProfil({
    nomActuel,
    confirme,
    onEnregistre,
}: {
    nomActuel: string | null;
    confirme: boolean;
    onEnregistre: () => void;
}) {
    const depart = decouperNom(nomActuel);
    const [prenom, setPrenom] = useState(depart.prenom);
    const [nomFamille, setNomFamille] = useState(depart.nomFamille);
    const [envoi, demarrer] = useTransition();

    function enregistrer() {
        demarrer(async () => {
            const res = await enregistrerNomAction({ prenom, nom: nomFamille });
            if (res.succes) {
                toast.success("Ton nom est enregistré");
                onEnregistre();
            } else {
                toast.error(res.erreur);
            }
        });
    }

    return (
        <div className="mt-[18px] rounded-lg border border-border bg-card p-4">
            <p className="text-[15px] font-bold text-foreground">Ton nom</p>
            <p className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">
                {confirme
                    ? "Ton prénom et ton nom sont affichés à côté de ce que tu ajoutes. Tu peux les changer ici."
                    : "Ton nom sera affiché à côté de ce que tu ajoutes. Tant que tu ne l'as pas confirmé ici, tu ne peux pas ajouter de texte."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Prénom"
                    aria-label="Prénom"
                    autoComplete="given-name"
                />
                <input
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                    value={nomFamille}
                    onChange={(e) => setNomFamille(e.target.value)}
                    placeholder="Nom"
                    aria-label="Nom"
                    autoComplete="family-name"
                />
            </div>
            <button
                type="button"
                disabled={envoi}
                onClick={enregistrer}
                className={cn(
                    "mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-sens-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-sens-600",
                    envoi && "opacity-60",
                )}
            >
                {envoi ? "Enregistrement…" : "Enregistrer mon nom"}
            </button>
        </div>
    );
}

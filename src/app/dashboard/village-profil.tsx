"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { listerCommunesAction, type CommuneOption } from "@/app/actions/communes";
import { definirVillageAction } from "@/app/actions/membres";
import { ChampSuggestions } from "@/components/champ-suggestions";

// Remplace `selecteur-village.tsx` le 13/09/2026, sur retour direct de John
// après vérification à l'écran : un `<select>` natif de 1 605 communes triées
// par population, sans recherche, est illisible (« la liste est en bordel »).
// Deux changements : tri alphabétique, et une vraie recherche texte qui
// filtre la liste déjà chargée — pas besoin d'un aller-retour serveur par
// frappe, 1 605 lignes tiennent en mémoire.
//
// Deuxième retour du même message : le village doit se changer « à tout
// moment dans notre profil », pas seulement tant qu'il est vide. Ce composant
// s'affiche donc toujours dans « Mon espace », avec un état affichage/édition
// plutôt qu'une apparition conditionnée à l'absence de village.
const RESULTATS_MAX = 50;

export function VillageProfil({
    villageActuel,
    onDefini,
}: {
    villageActuel: string | null;
    onDefini: () => void;
}) {
    const [enEdition, setEnEdition] = useState(!villageActuel);
    const [communes, setCommunes] = useState<CommuneOption[] | null>(null);
    const [recherche, setRecherche] = useState("");
    const [choisie, setChoisie] = useState<CommuneOption | null>(null);
    const [enCours, setEnCours] = useState(false);

    useEffect(() => {
        if (enEdition && !communes) listerCommunesAction().then(setCommunes);
    }, [enEdition, communes]);

    const resultats = useMemo(() => {
        if (!communes) return null;
        const q = recherche.trim().toLowerCase();
        const filtres = q ? communes.filter((c) => c.nom.toLowerCase().includes(q)) : communes;
        return filtres.slice(0, RESULTATS_MAX);
    }, [communes, recherche]);

    function choisir(c: CommuneOption) {
        setChoisie(c);
        setRecherche(`${c.nom} (${c.departement})`);
    }

    function annuler() {
        setEnEdition(false);
        setRecherche("");
        setChoisie(null);
    }

    async function valider() {
        if (!choisie) return;
        setEnCours(true);
        const res = await definirVillageAction(choisie.id);
        setEnCours(false);
        if (res.succes) {
            toast.success(res.message);
            annuler();
            onDefini();
        } else {
            toast.error(res.erreur);
        }
    }

    if (!enEdition) {
        return (
            <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm text-foreground">{villageActuel}</p>
                <button
                    type="button"
                    onClick={() => setEnEdition(true)}
                    className="text-sm font-semibold text-marque-rouge-texte"
                >
                    Changer
                </button>
            </div>
        );
    }

    return (
        <div className="mt-3">
            <ChampSuggestions
                label="Chercher un village"
                valeur={recherche}
                onValeurChange={(v) => {
                    setRecherche(v);
                    setChoisie(null);
                }}
                placeholder="Chercher un village…"
                actif
                suggestions={resultats}
                cleDe={(c) => String(c.id)}
                rendre={(c) => `${c.nom} (${c.departement})`}
                onChoisir={choisir}
                vide="Aucun village trouvé"
            />

            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    onClick={valider}
                    disabled={!choisie || enCours}
                    className="h-9 shrink-0 rounded-md bg-marque-rouge-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-50"
                >
                    Valider
                </button>
                {villageActuel && (
                    <button
                        type="button"
                        onClick={annuler}
                        className="h-9 shrink-0 rounded-md px-4 text-sm font-semibold text-muted-foreground"
                    >
                        Annuler
                    </button>
                )}
            </div>
        </div>
    );
}

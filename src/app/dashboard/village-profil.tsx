"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { listerCommunesAction, type CommuneOption } from "@/app/actions/communes";
import { definirVillageAction } from "@/app/actions/membres";

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
    const [listeOuverte, setListeOuverte] = useState(false);
    const [enCours, setEnCours] = useState(false);
    const conteneur = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (enEdition && !communes) listerCommunesAction().then(setCommunes);
    }, [enEdition, communes]);

    useEffect(() => {
        function surClicDehors(e: MouseEvent) {
            if (conteneur.current && !conteneur.current.contains(e.target as Node)) {
                setListeOuverte(false);
            }
        }
        document.addEventListener("mousedown", surClicDehors);
        return () => document.removeEventListener("mousedown", surClicDehors);
    }, []);

    const resultats = useMemo(() => {
        if (!communes) return [];
        const q = recherche.trim().toLowerCase();
        const filtres = q ? communes.filter((c) => c.nom.toLowerCase().includes(q)) : communes;
        return filtres.slice(0, RESULTATS_MAX);
    }, [communes, recherche]);

    function choisir(c: CommuneOption) {
        setChoisie(c);
        setRecherche(`${c.nom} (${c.departement})`);
        setListeOuverte(false);
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
        <div ref={conteneur} className="relative mt-3">
            <input
                value={recherche}
                onChange={(e) => {
                    setRecherche(e.target.value);
                    setChoisie(null);
                    setListeOuverte(true);
                }}
                onFocus={() => setListeOuverte(true)}
                placeholder="Chercher un village…"
                aria-label="Chercher un village"
                // `text-base` et non `text-sm` : sous 16 px, iOS zoome sur le
                // champ au focus.
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground"
            />

            {listeOuverte && (
                <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-input bg-background shadow-lg">
                    {!communes ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">Chargement…</li>
                    ) : resultats.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">Aucun village trouvé</li>
                    ) : (
                        resultats.map((c) => (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    onClick={() => choisir(c)}
                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-neutre-50"
                                >
                                    {c.nom} ({c.departement})
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}

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

"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { toast } from "sonner";

import { listerCommunesAction, type CommuneOption } from "@/app/actions/communes";
import { definirVillageAction } from "@/app/actions/membres";
import { BadgeConfiance } from "@/components/badge-confiance";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { formeDictionnaire, type VarianteDetaillee } from "@/lib/dictionnaire";
import { cn } from "@/lib/utils";

// L'habillage des feuilles de contribution, sorti de feuille-contribution.tsx
// le 28/09/2026 quand « Chez moi aussi » est passé lui aussi par une feuille :
// mêmes boutons, même cadre à chevron, même étape de village.

export const BOUTON_PRINCIPAL =
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-sens-500 px-4 text-base font-semibold text-white transition-colors hover:bg-sens-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";
export const BOUTON_SECONDAIRE =
    "inline-flex h-12 w-full items-center justify-center rounded-md border border-bordure-defaut px-4 text-base font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";
export const CHAMP =
    "h-12 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sens-500";
export const LIGNE_CHOIX =
    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export interface Village {
    id: number;
    nom: string;
    departement: string;
}

/** Un tiroir qui monte du bas sur téléphone, une fenêtre centrée à partir de
 *  la tablette. Partagé par l'ajout et par « Chez moi aussi » : les deux
 *  gestes doivent avoir la même forme. */
export function FeuilleAdaptative({
    ouvert,
    onOuvertChange,
    titre,
    description,
    children,
}: {
    ouvert: boolean;
    onOuvertChange: (ouvert: boolean) => void;
    titre: string;
    description: string;
    children: ReactNode;
}) {
    const mobile = useIsMobile();
    if (mobile) {
        return (
            <Drawer open={ouvert} onOpenChange={onOuvertChange} repositionInputs={false} shouldScaleBackground={false}>
                <DrawerContent className="max-h-[92dvh]">
                    <DrawerTitle className="sr-only">{titre}</DrawerTitle>
                    <DrawerDescription className="sr-only">{description}</DrawerDescription>
                    <div className="overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
                </DrawerContent>
            </Drawer>
        );
    }
    return (
        <Dialog open={ouvert} onOpenChange={onOuvertChange}>
            <DialogContent className="max-h-[88dvh] max-w-md overflow-y-auto p-6">
                <DialogTitle className="sr-only">{titre}</DialogTitle>
                <DialogDescription className="sr-only">{description}</DialogDescription>
                {children}
            </DialogContent>
        </Dialog>
    );
}

// --- Habillage commun ---------------------------------------------------------------

export function Cadre({
    titre,
    sousTitre,
    onRetour,
    children,
}: {
    titre: string;
    sousTitre?: ReactNode;
    onRetour?: () => void;
    children: ReactNode;
}) {
    return (
        <section className="flex flex-col">
            <div className="flex items-start gap-1">
                {onRetour && (
                    <button
                        type="button"
                        onClick={onRetour}
                        aria-label="Étape précédente"
                        className="-ml-2 mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                )}
                <div className="min-w-0">
                    <h2 className="text-[22px] font-extrabold leading-tight text-foreground">{titre}</h2>
                    {sousTitre && <p className="mt-1 text-sm text-muted-foreground">{sousTitre}</p>}
                </div>
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

export function Francais({ children }: { children: ReactNode }) {
    return <span className="font-semibold text-foreground">{children}</span>;
}

export function Ligne({ terme, children }: { terme: string; children: ReactNode }) {
    return (
        <div className="px-3.5 py-3">
            <dt className="text-xs font-semibold text-muted-foreground">{terme}</dt>
            <dd className="mt-0.5">{children}</dd>
        </div>
    );
}

// --- Village --------------------------------------------------------------------

function sansAccent(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]+/g, "").replace(/[-']/g, " ");
}

export function EtapeVillage({
    actuel,
    onRetour,
    onChoisi,
}: {
    actuel: Village | null;
    onRetour?: () => void;
    onChoisi: (v: Village) => void;
}) {
    return (
        <Cadre
            titre="D'où vient ton parler ?"
            sousTitre={actuel ? <>Aujourd&apos;hui : {actuel.nom}. Il sera aussi changé dans Mon espace.</> : "Chaque façon de dire que tu ajoutes est rattachée à ton village. On ne le détecte pas : c'est toi qui le choisis."}
            onRetour={onRetour}
        >
            <RechercheVillage onChoisi={onChoisi} autoFocus />
        </Cadre>
    );
}

/** Le champ et sa liste : un appui sur un village l'enregistre sur le profil.
 *  Partagé par les feuilles de contribution et par le tiroir d'accueil. */
export function RechercheVillage({ onChoisi, autoFocus = false }: { onChoisi: (v: Village) => void; autoFocus?: boolean }) {
    const [communes, setCommunes] = useState<CommuneOption[] | null>(null);
    const [recherche, setRecherche] = useState("");
    const [envoi, demarrer] = useTransition();

    useEffect(() => { listerCommunesAction().then(setCommunes); }, []);

    const resultats = useMemo(() => {
        const q = sansAccent(recherche.trim());
        if (!communes || !q) return [];
        return communes.filter((c) => sansAccent(c.nom).includes(q)).slice(0, 8);
    }, [communes, recherche]);

    function choisir(c: CommuneOption) {
        demarrer(async () => {
            const res = await definirVillageAction(c.id);
            if (res.succes) onChoisi({ id: c.id, nom: c.nom, departement: c.departement });
            else toast.error(res.erreur);
        });
    }

    return (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    aria-label="Chercher ton village"
                    placeholder="Ton village"
                    autoFocus={autoFocus}
                    autoComplete="off"
                    className={cn(CHAMP, "pl-10")}
                />
            </div>
            <ul className="mt-2 flex flex-col" aria-live="polite">
                {communes === null && recherche.trim() && <li className="px-3 py-2.5 text-sm text-muted-foreground">Chargement…</li>}
                {communes && recherche.trim() && resultats.length === 0 && (
                    <li className="px-3 py-2.5 text-sm text-muted-foreground">Aucun village de ce nom en Alsace ni en Moselle.</li>
                )}
                {resultats.map((c) => (
                    <li key={c.id}>
                        <button type="button" disabled={envoi} onClick={() => choisir(c)} className={LIGNE_CHOIX}>
                            <span className="font-semibold text-foreground">{c.nom}</span>
                            <span className="text-sm text-muted-foreground">{c.departement}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}

// --- Une forme existante ---------------------------------------------------------

export function CarteCandidat({
    v,
    action,
}: {
    v: VarianteDetaillee;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border bg-card p-3.5">
            <p lang="gsw" className="text-xl font-bold text-foreground">{formeDictionnaire(v.forme)}</p>
            <div className="mt-1.5">
                <BadgeConfiance nbSources={v.nbSources} nbVillages={v.nbVillages} />
            </div>
            {v.villages.length > 0 && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                    {v.villages.slice(0, 4).map((x) => x.nom).join(", ")}
                    {v.villages.length > 4 ? ` et ${v.villages.length - 4} autre${v.villages.length - 4 > 1 ? "s" : ""}` : ""}
                </p>
            )}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

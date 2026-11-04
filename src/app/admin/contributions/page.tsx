"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, EyeOff, Eye, MapPin, Undo2, UserX } from "lucide-react";
import { toast } from "sonner";

import {
    annulerValidationDefiAction,
    listerContributionsAction,
    listerMembresContributeursAction,
    masquerFormeAction,
    reafficherFormeAction,
    retirerVoteModereAction,
    validerPourDefiAction,
} from "@/app/actions/moderation";
import { AppHeader } from "@/components/app-header";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListeAdmin } from "@/hooks/use-liste-admin";
import { formeDictionnaire } from "@/lib/dictionnaire";
import {
    categorieDe,
    LIBELLES_CONTRIBUTION,
    TYPES_CONTRIBUTION,
    type LigneContribution,
    type PageContributions,
    type TypeContribution,
} from "@/lib/moderation";

// Les gestes des membres et ceux de l'admin, dans une seule liste (04/11/2026).
// Décisions de John : un texte de membre reste publié tout de suite ; John voit
// tout et peut agir à tout moment ; rien n'est effacé. Une forme entre dans le
// défi si elle vient d'une source ou si tu la valides ici.

/** Où l'on note la dernière visite, pour le filtre « depuis ma dernière visite ». */
const CLE_DERNIERE_VISITE = "ed-admin-contributions-vu";

type Resultat = { succes: true } | { succes: false; erreur: string };

/** jj/mm/aaaa à hh:mm : à la main, pour ne pas dépendre de `toLocaleString`
 *  (espace fine insécable, que la police ne dessine pas). */
function dateEtHeure(iso: string): string {
    const d = new Date(iso);
    const deux = (n: number) => String(n).padStart(2, "0");
    return `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()} à ${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

interface MembreFiltre {
    id: string;
    nom: string;
}

export default function AdminContributionsPage() {
    const { estAdmin, items: membres } = useListeAdmin<MembreFiltre>("admin-contributions-membres", async () => {
        const res = await listerMembresContributeursAction();
        return res.succes ? { succes: true, liste: res.membres } : res;
    });

    const [filtreType, setFiltreType] = useState<TypeContribution | "tout">("tout");
    const [filtreMembre, setFiltreMembre] = useState("");
    const [derniereVisite, setDerniereVisite] = useState<string | null>(null);
    const [depuisVisite, setDepuisVisite] = useState(false);

    const [lignes, setLignes] = useState<LigneContribution[]>([]);
    const [pagesChargees, setPagesChargees] = useState(0);
    const [plusDeLignes, setPlusDeLignes] = useState(false);
    const [chargement, setChargement] = useState(true);
    const [enCours, setEnCours] = useState<string | null>(null);
    const [aConfirmer, setAConfirmer] = useState<LigneContribution | null>(null);

    // Lu une fois, avant d'écrire la visite du jour : sinon la visite d'à côté
    // effacerait la précédente. `useRef` évite le double passage du mode strict.
    const lue = useRef(false);
    useEffect(() => {
        if (lue.current) return;
        lue.current = true;
        try {
            setDerniereVisite(localStorage.getItem(CLE_DERNIERE_VISITE));
            localStorage.setItem(CLE_DERNIERE_VISITE, new Date().toISOString());
        } catch {
            // Navigation privée ou stockage bloqué : le filtre reste désactivé.
        }
    }, []);

    // Une réponse ancienne (filtre changé entre deux clics) ne remplace pas la liste.
    const requete = useRef(0);

    const chargerPages = useCallback(
        async (nombre: number) => {
            const id = ++requete.current;
            setChargement(true);
            const pages: PageContributions[] = [];
            for (let page = 1; page <= nombre; page++) {
                const res = await listerContributionsAction({
                    page,
                    type: filtreType === "tout" ? undefined : filtreType,
                    membreId: filtreMembre || undefined,
                    depuis: depuisVisite && derniereVisite ? derniereVisite : undefined,
                });
                if (id !== requete.current) return;
                if (!res.succes) {
                    toast.error(res.erreur);
                    setChargement(false);
                    return;
                }
                pages.push(res.valeur);
                if (!res.valeur.plusDeLignes) break;
            }
            if (id !== requete.current) return;
            const derniere = pages[pages.length - 1];
            setLignes(pages.flatMap((p) => p.lignes));
            setPagesChargees(Math.max(1, pages.length));
            setPlusDeLignes(derniere?.plusDeLignes ?? false);
            setChargement(false);
        },
        [filtreType, filtreMembre, depuisVisite, derniereVisite],
    );

    // Un changement de filtre repart de la première page.
    useEffect(() => {
        if (estAdmin) void chargerPages(1);
    }, [estAdmin, chargerPages]);

    async function executer(cle: string, geste: () => Promise<Resultat>, messageOk: string) {
        if (enCours) return;
        setEnCours(cle);
        const res = await geste();
        if (res.succes) {
            toast.success(messageOk);
            // Le geste a pu changer des lignes déjà chargées : on relit ce qui était affiché.
            await chargerPages(Math.max(1, pagesChargees));
        } else {
            toast.error(res.erreur);
        }
        setEnCours(null);
    }

    if (!estAdmin) return <div className="p-8 text-center">Accès refusé</div>;

    const occupe = (cle: string) => enCours === cle;

    return (
        <div className="flex min-h-ecran flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
            <AppHeader variant="stack" titre="Contributions" backHref="/admin" actif="admin" />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Ce qui se passe chez les membres</CardTitle>
                        <CardDescription>
                            Un texte de membre est publié tout de suite. Une forme n&apos;entre dans le défi
                            que si elle vient d&apos;une source ou si tu la valides ici. Tu peux masquer une
                            forme, la réafficher, retirer un vote ou valider une forme. Rien n&apos;est
                            effacé : chaque geste reste dans la liste.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5 text-sm font-medium">
                                Type de geste
                                <select
                                    className="h-11 rounded-md border border-input bg-background px-3 text-base"
                                    value={filtreType}
                                    onChange={(e) => setFiltreType(e.target.value as TypeContribution | "tout")}
                                >
                                    <option value="tout">Tous les gestes</option>
                                    {TYPES_CONTRIBUTION.map((t) => (
                                        <option key={t} value={t}>
                                            {LIBELLES_CONTRIBUTION[t]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm font-medium">
                                Membre
                                <select
                                    className="h-11 rounded-md border border-input bg-background px-3 text-base"
                                    value={filtreMembre}
                                    onChange={(e) => setFiltreMembre(e.target.value)}
                                >
                                    <option value="">Tous les membres</option>
                                    {membres.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.nom}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <Button
                            type="button"
                            variant={depuisVisite ? "default" : "outline"}
                            className="h-11 w-full sm:w-auto"
                            aria-pressed={depuisVisite}
                            disabled={!derniereVisite}
                            onClick={() => setDepuisVisite((v) => !v)}
                        >
                            {derniereVisite
                                ? depuisVisite
                                    ? "Tous les gestes"
                                    : `Seulement depuis ma dernière visite (${dateEtHeure(derniereVisite)})`
                                : "Première visite : tous les gestes sont affichés"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Gestes ({lignes.length}
                            {plusDeLignes ? ", il y en a d'autres" : ""})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chargement && lignes.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">Chargement…</p>
                        ) : lignes.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">Aucun geste pour ces filtres.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {lignes.map((l) => (
                                    <li
                                        key={`${l.genre}-${l.id}`}
                                        className="flex flex-col gap-2 rounded-lg border border-border p-3.5"
                                    >
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                            {l.mot.visible ? (
                                                <Link
                                                    href={`/entree/${l.mot.id}`}
                                                    className="text-lg font-bold text-foreground underline-offset-4 hover:underline"
                                                >
                                                    {l.mot.francais}
                                                </Link>
                                            ) : (
                                                <span className="text-lg font-bold text-foreground">
                                                    {l.mot.francais}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {dateEtHeure(l.le)}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">{LIBELLES_CONTRIBUTION[l.type]}</span>
                                            {" · "}
                                            {categorieDe(l.mot)}
                                            {l.membre ? ` · ${l.membre}` : ""}
                                            {!l.membre && l.source ? " · Forme de source" : ""}
                                            {!l.membre && !l.source ? " · Compte supprimé" : ""}
                                        </p>

                                        {l.village && (
                                            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                                {l.village}
                                            </p>
                                        )}

                                        <p lang="gsw" className="text-base font-semibold text-foreground">
                                            {l.type === "modification" && l.ancienneForme && l.nouvelleForme ? (
                                                <>
                                                    {formeDictionnaire(l.ancienneForme)}
                                                    <span className="mx-1.5 font-normal text-muted-foreground">devient</span>
                                                    {formeDictionnaire(l.nouvelleForme)}
                                                </>
                                            ) : (
                                                formeDictionnaire(l.forme)
                                            )}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                            {l.masquee && (
                                                <span className="rounded-full border border-destructive px-2.5 py-0.5 text-destructive">
                                                    Masquée
                                                </span>
                                            )}
                                            {l.validee && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 px-2.5 py-0.5 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                                    Validée pour le défi
                                                </span>
                                            )}
                                            {!l.masquee && !l.validee && !l.source && l.membre && (
                                                <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
                                                    Au dictionnaire, pas dans le défi
                                                </span>
                                            )}
                                            {l.acteur && (
                                                <span className="font-normal text-muted-foreground">Fait par {l.acteur}</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {l.masquee ? (
                                                <Button
                                                    variant="outline"
                                                    className="h-11"
                                                    disabled={enCours !== null}
                                                    onClick={() =>
                                                        executer(`reafficher-${l.varianteId}`, () => reafficherFormeAction(l.varianteId), "Forme réaffichée")
                                                    }
                                                >
                                                    <Eye />
                                                    {occupe(`reafficher-${l.varianteId}`) ? "…" : "Réafficher"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="h-11"
                                                    disabled={enCours !== null}
                                                    onClick={() =>
                                                        executer(`masquer-${l.varianteId}`, () => masquerFormeAction(l.varianteId), "Forme masquée")
                                                    }
                                                >
                                                    <EyeOff />
                                                    {occupe(`masquer-${l.varianteId}`) ? "…" : "Masquer"}
                                                </Button>
                                            )}

                                            {!l.source && l.membre && !l.validee && !l.masquee && (
                                                <Button
                                                    variant="outline"
                                                    className="h-11"
                                                    disabled={enCours !== null}
                                                    onClick={() =>
                                                        executer(`valider-${l.varianteId}`, () => validerPourDefiAction(l.varianteId), "Forme validée pour le défi")
                                                    }
                                                >
                                                    <CheckCircle2 />
                                                    {occupe(`valider-${l.varianteId}`) ? "…" : "Valider pour le défi"}
                                                </Button>
                                            )}
                                            {l.validee && (
                                                <Button
                                                    variant="outline"
                                                    className="h-11"
                                                    disabled={enCours !== null}
                                                    onClick={() =>
                                                        executer(`annuler-${l.varianteId}`, () => annulerValidationDefiAction(l.varianteId), "Validation annulée")
                                                    }
                                                >
                                                    <Undo2 />
                                                    {occupe(`annuler-${l.varianteId}`) ? "…" : "Annuler la validation"}
                                                </Button>
                                            )}

                                            {l.voteActif && l.membreId && (
                                                <Button
                                                    variant="outline"
                                                    className="h-11 text-destructive"
                                                    disabled={enCours !== null}
                                                    onClick={() => setAConfirmer(l)}
                                                >
                                                    <UserX />
                                                    Retirer le vote
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {plusDeLignes && (
                            <div className="mt-4 flex justify-center">
                                <Button
                                    variant="outline"
                                    className="h-11 w-full sm:w-auto"
                                    disabled={chargement}
                                    onClick={() => chargerPages(pagesChargees + 1)}
                                >
                                    Voir plus
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={aConfirmer !== null} onOpenChange={(ouvert) => !ouvert && setAConfirmer(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer ce vote ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {aConfirmer
                                ? `Le village de ${aConfirmer.membre ?? "ce membre"} ne figure plus sur « ${formeDictionnaire(aConfirmer.forme)} ». Le retrait reste visible dans la liste.`
                                : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-11">Garder le vote</AlertDialogCancel>
                        <AlertDialogAction
                            className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                const cible = aConfirmer;
                                setAConfirmer(null);
                                if (cible?.membreId)
                                    void executer(
                                        `retirer-${cible.varianteId}`,
                                        () => retirerVoteModereAction(cible.varianteId, cible.membreId!),
                                        "Vote retiré",
                                    );
                            }}
                        >
                            Retirer le vote
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

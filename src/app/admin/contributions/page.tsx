"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, EyeOff, Eye, MapPin, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
    annulerValidationDefiAction,
    listerContributionsAction,
    masquerFormeAction,
    reafficherFormeAction,
    retirerCategorieInsulteAction,
    validerPourDefiAction,
} from "@/app/actions/moderation";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/components/auth-provider";
import { EcrireMembre } from "@/components/ecrire-membre";
import { Button } from "@/components/ui/button";
import { formeDictionnaire } from "@/lib/dictionnaire";
import {
    categorieDe,
    LIBELLES_CONTRIBUTION,
    type FormeContribution,
    type MotContribution,
    type PageContributions,
} from "@/lib/moderation";

// L'écran s'ouvre sur ce qui reste à décider (07/11/2026, demande de John) : une
// forme de membre, ni validée, ni masquée. Valider ou masquer la fait sortir de la
// liste, et la liste finit vide. « Tout » remontre l'historique. Un mot apparaît une
// seule fois, avec toutes ses formes.
//
// Décisions de John du 04/11 : un texte de membre est visible tout de suite pour les membres connectés ;
// John voit tout et peut agir à tout moment ; rien n'est effacé. Une forme peut être
// montrée sans compte et entrer dans le défi si elle vient d'une source ou si tu la valides ici.

type Resultat = { succes: true } | { succes: false; erreur: string };

/** jj/mm/aaaa à hh:mm : à la main, pour ne pas dépendre de `toLocaleString`
 *  (espace fine insécable, que la police ne dessine pas). */
function dateEtHeure(iso: string): string {
    const d = new Date(iso);
    const deux = (n: number) => String(n).padStart(2, "0");
    return `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()} à ${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

export default function AdminContributionsPage() {
    const { session, role } = useAuth();
    const estAdmin = Boolean(session) && role === "admin";

    const [aRegarder, setARegarder] = useState(true);
    const [mots, setMots] = useState<MotContribution[]>([]);
    const [pagesChargees, setPagesChargees] = useState(0);
    const [plusDeMots, setPlusDeMots] = useState(false);
    const [chargement, setChargement] = useState(true);
    const [enCours, setEnCours] = useState<string | null>(null);

    // Une réponse ancienne (filtre changé entre deux clics) ne remplace pas la liste.
    const requete = useRef(0);

    const chargerPages = useCallback(
        async (nombre: number) => {
            const id = ++requete.current;
            setChargement(true);
            const pages: PageContributions[] = [];
            for (let page = 1; page <= nombre; page++) {
                const res = await listerContributionsAction({ page, aRegarder });
                if (id !== requete.current) return;
                if (!res.succes) {
                    toast.error(res.erreur);
                    setChargement(false);
                    return;
                }
                pages.push(res.valeur);
                if (!res.valeur.plusDeMots) break;
            }
            if (id !== requete.current) return;
            const derniere = pages[pages.length - 1];
            setMots(pages.flatMap((p) => p.mots));
            setPagesChargees(Math.max(1, pages.length));
            setPlusDeMots(derniere?.plusDeMots ?? false);
            setChargement(false);
        },
        [aRegarder],
    );

    // Un changement de vue repart de la première page.
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

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-8">
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={aRegarder ? "default" : "outline"}
                        aria-pressed={aRegarder}
                        className="h-11"
                        onClick={() => setARegarder(true)}
                    >
                        À décider
                    </Button>
                    <Button
                        variant={aRegarder ? "outline" : "default"}
                        aria-pressed={!aRegarder}
                        className="h-11"
                        onClick={() => setARegarder(false)}
                    >
                        Tout
                    </Button>
                </div>

                {chargement && mots.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Chargement…</p>
                ) : mots.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        {aRegarder ? "Rien à décider : tout est traité." : "Aucun geste pour l'instant."}
                    </p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {mots.map((m) => (
                            <li key={m.mot.id} className="rounded-lg border border-border p-4">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                    {m.mot.visible ? (
                                        <Link
                                            href={`/entree/${m.mot.id}`}
                                            className="text-lg font-bold text-foreground underline-offset-4 hover:underline"
                                        >
                                            {m.mot.francais}
                                        </Link>
                                    ) : (
                                        <span className="text-lg font-bold text-foreground">{m.mot.francais}</span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {dateEtHeure(m.dernier)} · {m.nbGestes} {m.nbGestes > 1 ? "gestes" : "geste"}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{categorieDe(m.mot)}</p>

                                {m.retraitInsulte && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Catégorie insulte retirée
                                        {m.retraitInsulte.acteur ? ` par ${m.retraitInsulte.acteur}` : ""} · {dateEtHeure(m.retraitInsulte.le)}
                                    </p>
                                )}

                                {/* Le mot est une insulte et aucune source ne le porte : l'admin peut
                                    lui retirer la catégorie. Le mot garde sa fiche et ses formes. */}
                                {m.mot.contexte === "insulte" && m.motSansSource && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-auto min-h-11 whitespace-normal py-2 text-left"
                                            disabled={enCours !== null}
                                            onClick={() =>
                                                executer(`insulte-${m.mot.id}`, () => retirerCategorieInsulteAction(m.mot.id), "Catégorie insulte retirée")
                                            }
                                        >
                                            {occupe(`insulte-${m.mot.id}`) ? "…" : "Ce n'est pas une insulte"}
                                        </Button>
                                    </div>
                                )}

                                <ul className="mt-3 flex flex-col gap-3">
                                    {m.formes.map((f) => (
                                        <FormeLigne
                                            key={f.varianteId}
                                            forme={f}
                                            enCours={enCours}
                                            occupe={occupe}
                                            onGeste={executer}
                                        />
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}

                {plusDeMots && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto"
                            disabled={chargement}
                            onClick={() => chargerPages(pagesChargees + 1)}
                        >
                            Voir plus
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FormeLigne({
    forme,
    enCours,
    occupe,
    onGeste,
}: {
    forme: FormeContribution;
    enCours: string | null;
    occupe: (cle: string) => boolean;
    onGeste: (cle: string, geste: () => Promise<Resultat>, messageOk: string) => Promise<void>;
}) {
    const { varianteId, dernier, source, masquee, validee } = forme;
    const membre = dernier.membre;
    const aMembre = Boolean(dernier.membreId && membre);

    return (
        <li className="flex flex-col gap-2 rounded-md border border-border/70 p-3">
            <p lang="gsw" className="text-base font-semibold text-foreground">
                {dernier.type === "modification" && dernier.ancienneForme && dernier.nouvelleForme ? (
                    <>
                        {formeDictionnaire(dernier.ancienneForme)}
                        <span className="mx-1.5 font-normal text-muted-foreground">devient</span>
                        {formeDictionnaire(dernier.nouvelleForme)}
                    </>
                ) : (
                    formeDictionnaire(forme.forme)
                )}
            </p>

            <p className="text-sm text-muted-foreground">
                {LIBELLES_CONTRIBUTION[dernier.type]}
                {membre ? ` · ${membre}` : source ? " · Forme de source" : " · Compte supprimé"}
                {dernier.village ? ` · ${dernier.village}` : ""}
                {dernier.acteur ? ` · fait par ${dernier.acteur}` : ""}
                {forme.nbGestes > 1 ? ` · ${forme.nbGestes} gestes` : ""}
            </p>

            {dernier.village && (
                <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {dernier.village}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {masquee && (
                    <span className="rounded-full border border-destructive px-2.5 py-0.5 text-destructive">Masquée</span>
                )}
                {validee && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 px-2.5 py-0.5 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        Validée : montrée sans compte et dans le défi
                    </span>
                )}
                {!masquee && !validee && !source && aMembre && (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
                        Visible par les membres seulement
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {!source &&
                    (masquee ? (
                        <Button
                            variant="outline"
                            className="h-auto min-h-11 whitespace-normal py-2 text-left"
                            disabled={enCours !== null}
                            onClick={() => onGeste(`reafficher-${varianteId}`, () => reafficherFormeAction(varianteId), "Forme réaffichée")}
                        >
                            <Eye />
                            {occupe(`reafficher-${varianteId}`) ? "…" : "Réafficher"}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="h-auto min-h-11 whitespace-normal py-2 text-left"
                            disabled={enCours !== null}
                            onClick={() => onGeste(`masquer-${varianteId}`, () => masquerFormeAction(varianteId), "Forme masquée")}
                        >
                            <EyeOff />
                            {occupe(`masquer-${varianteId}`) ? "…" : "Masquer"}
                        </Button>
                    ))}

                {!source && aMembre && !validee && !masquee && (
                    <Button
                        variant="outline"
                        className="h-auto min-h-11 whitespace-normal py-2 text-left"
                        disabled={enCours !== null}
                        onClick={() =>
                            onGeste(`valider-${varianteId}`, () => validerPourDefiAction(varianteId), "Forme validée : montrée sans compte et dans le défi")
                        }
                    >
                        <CheckCircle2 />
                        {occupe(`valider-${varianteId}`) ? "…" : "Valider : montrer sans compte"}
                    </Button>
                )}

                {!source && validee && (
                    <Button
                        variant="outline"
                        className="h-auto min-h-11 whitespace-normal py-2 text-left"
                        disabled={enCours !== null}
                        onClick={() => onGeste(`annuler-${varianteId}`, () => annulerValidationDefiAction(varianteId), "Validation annulée")}
                    >
                        <Undo2 />
                        {occupe(`annuler-${varianteId}`) ? "…" : "Annuler la validation"}
                    </Button>
                )}

                {aMembre && dernier.membreId && (
                    <EcrireMembre membreId={dernier.membreId} nom={membre!}>
                        <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2 text-left">
                            Écrire à ce membre
                        </Button>
                    </EcrireMembre>
                )}
            </div>
        </li>
    );
}

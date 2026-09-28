"use client";

import { useId, useState } from "react";

import { formeDictionnaire } from "@/lib/dictionnaire";
import {
    ARTICLES_PROPOSES,
    composerForme,
    detacherArticle,
    libelleArticle,
    prefixeAutre,
    type FormeComposee,
} from "@/lib/saisie-forme";
import { cn } from "@/lib/utils";

// Le bloc « article + forme » (28/09/2026) : la feuille de contribution et la
// modification d'une forme le partagent, pour qu'une forme s'écrive partout de
// la même façon.
//
// L'article est facultatif (décision de John) : « Sans article » est choisi
// d'office, et le choix reste replié sous le champ tant qu'on ne l'ouvre pas. S'il est tapé dans le champ (`d'r Lohn`), il en est détaché au
// moment de quitter le champ, et l'aperçu le montre déjà détaché pendant la
// frappe : on voit ce qui sera publié, jamais une recomposition surprise.

export interface ValeurForme {
    /** Préfixe exact collé devant la forme (`d'r `, `d'`…), ou `null`. */
    prefixe: string | null;
    /** Vrai quand l'article vient du champ libre « Autre ». */
    autre: boolean;
    reste: string;
}

export const VALEUR_VIDE: ValeurForme = { prefixe: null, autre: false, reste: "" };

/** La valeur de départ d'un champ pré-rempli : `d'r Lohn` arrive détaché. */
export function valeurDepuis(forme: string): ValeurForme {
    const { prefixe, reste } = detacherArticle(forme);
    return { prefixe, autre: false, reste };
}

/** Ce qui sera publié, article tapé dans le champ compris. */
export function formeDeValeur(v: ValeurForme): FormeComposee | null {
    if (v.prefixe) return composerForme(v.prefixe, v.reste);
    const d = detacherArticle(v.reste);
    return composerForme(d.prefixe, d.reste);
}

/** La valeur à envoyer au serveur, article tapé détaché. */
export function saisieDeValeur(v: ValeurForme): { prefixe: string | null; reste: string } {
    if (v.prefixe) return { prefixe: v.prefixe, reste: v.reste };
    return detacherArticle(v.reste);
}

const PUCE =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50";

export function ChampForme({
    valeur,
    onChange,
    desactive,
    autoFocus,
    compact,
}: {
    valeur: ValeurForme;
    onChange: (v: ValeurForme) => void;
    desactive?: boolean;
    autoFocus?: boolean;
    /** Sans aperçu ni légende : la modification en ligne d'une carte. */
    compact?: boolean;
}) {
    const id = useId();
    const [autreTexte, setAutreTexte] = useState(
        valeur.autre && valeur.prefixe ? valeur.prefixe.trim() : "",
    );
    const choisi = valeur.prefixe === null
        ? null
        : valeur.autre
            ? "autre"
            : ARTICLES_PROPOSES.find((a) => a.libelle === libelleArticle(valeur.prefixe!))?.libelle ?? "autre";
    const apercu = formeDeValeur(valeur);
    const [articleOuvert, setArticleOuvert] = useState(false);

    function choisir(libelle: string | null) {
        if (libelle === null) return onChange({ ...valeur, prefixe: null, autre: false });
        if (libelle === "autre") return onChange({ ...valeur, prefixe: prefixeAutre(autreTexte), autre: true });
        const a = ARTICLES_PROPOSES.find((x) => x.libelle === libelle)!;
        onChange({ ...valeur, prefixe: a.prefixe, autre: false });
    }

    // Détacher à la sortie du champ plutôt qu'à la frappe : le texte ne doit
    // pas bouger sous les doigts du membre pendant qu'il écrit.
    function detacher() {
        if (valeur.prefixe) return;
        const d = detacherArticle(valeur.reste);
        if (d.prefixe) onChange({ prefixe: d.prefixe, autre: false, reste: d.reste });
    }

    // L'article vient APRÈS la forme, replié tant qu'on ne l'ouvre pas (revue
    // du 28/09/2026) : posé en premier, six boutons de grammairien passaient
    // avant la seule question qui compte, « comment tu le dis ? ». Il s'ouvre
    // de lui-même dès qu'un article existe, tapé dans le champ ou pré-rempli.
    const articleVisible = articleOuvert || valeur.prefixe !== null;

    return (
        <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}>
            <label htmlFor={id} className="sr-only">Ta forme en alsacien</label>
            <input
                id={id}
                value={valeur.reste}
                onChange={(e) => onChange({ ...valeur, reste: e.target.value })}
                onBlur={detacher}
                placeholder={compact ? "" : "Comme tu l'écris"}
                lang="gsw"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus={autoFocus}
                maxLength={200}
                disabled={desactive}
                // `text-base` : sous 16 px, iOS zoome sur le champ au focus.
                className={cn(
                    "w-full min-w-0 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sens-500 disabled:opacity-60",
                    compact ? "h-9 text-base" : "h-12 text-lg font-semibold",
                )}
            />

            {!compact && (
                <p className="min-h-6 text-sm text-muted-foreground" aria-live="polite">
                    {apercu ? (
                        <>
                            Sera publié ainsi&nbsp;:{" "}
                            <span lang="gsw" className="text-base font-bold text-foreground">
                                {formeDictionnaire(apercu.forme)}
                            </span>
                        </>
                    ) : (
                        "Écris-la comme tu la prononces chez toi, sans chercher la « bonne » orthographe."
                    )}
                </p>
            )}

            {articleVisible ? (
                <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-foreground">
                        Article <span className="font-normal text-muted-foreground">(facultatif)</span>
                    </p>
                    <div role="radiogroup" aria-label="Article, facultatif" className="flex flex-wrap items-center gap-1.5">
                        {[{ libelle: null as string | null, texte: "Sans article" },
                          ...ARTICLES_PROPOSES.map((a) => ({ libelle: a.libelle as string | null, texte: a.libelle })),
                          { libelle: "autre", texte: "Autre" }].map((o) => {
                            const actif = choisi === o.libelle;
                            return (
                                <button
                                    key={o.texte}
                                    type="button"
                                    role="radio"
                                    aria-checked={actif}
                                    disabled={desactive}
                                    onClick={() => choisir(o.libelle)}
                                    className={cn(
                                        PUCE,
                                        actif
                                            ? "border-sens-500 bg-sens-500 text-white"
                                            : "border-bordure-defaut bg-background text-foreground hover:border-sens-500",
                                    )}
                                    lang={o.libelle && o.libelle !== "autre" ? "gsw" : undefined}
                                >
                                    {o.texte}
                                </button>
                            );
                        })}
                        {choisi === "autre" && (
                            <input
                                value={autreTexte}
                                onChange={(e) => {
                                    setAutreTexte(e.target.value);
                                    onChange({ ...valeur, prefixe: prefixeAutre(e.target.value), autre: true });
                                }}
                                aria-label="Ton article"
                                placeholder="dr, e…"
                                lang="gsw"
                                maxLength={10}
                                disabled={desactive}
                                className="h-9 w-20 shrink-0 rounded-md border border-input bg-background px-2.5 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sens-500 disabled:opacity-60"
                            />
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setArticleOuvert(true)}
                    disabled={desactive}
                    className="self-start rounded-md py-1.5 text-sm font-semibold text-sens-texte underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    + Préciser l&apos;article (d&apos;r, d&apos;, s&apos;…), facultatif
                </button>
            )}
        </div>
    );
}

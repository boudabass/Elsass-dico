"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { commencerPartieAction, motChezToiAction, type PartiePublique } from "@/app/actions/jeu";
import { NouvelleVariante } from "@/app/entree/[id]/nouvelle-variante";
import { VoteVariante } from "@/app/entree/[id]/vote-variante";
import { useAuth } from "@/components/auth-provider";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { cleCache } from "@/lib/cache-navigation";
import type { LemmeDetaille } from "@/lib/dictionnaire";
import { URL_INSCRIPTION_ODOO } from "@/lib/odoo";
import { cn } from "@/lib/utils";

import { BoutonPartager } from "./partage";

// Le bilan d'une partie, puis le seul geste de contribution du jeu : « et chez
// toi, on dit comment ? ». Facultatif et jamais compté (brief du 25/09/2026) :
// un jeu qui récompenserait le vote pousserait à voter au hasard.

export function Bilan({
    partie,
    onQuitter,
    onRejouer,
}: {
    partie: PartiePublique;
    onQuitter: () => void;
    onRejouer: (p: PartiePublique) => void;
}) {
    const resultats = partie.manches.map((m) => !!m.revelation && m.revelation.reponseId === m.revelation.bonneId);
    const score = resultats.filter(Boolean).length;
    const [enCours, demarrer] = useTransition();

    function rejouer() {
        demarrer(async () => {
            const res = await commencerPartieAction("libre");
            if (res.succes) {
                onRejouer(res.valeur);
                window.scrollTo({ top: 0 });
            } else toast.error(res.erreur);
        });
    }

    return (
        <>
            <p className="text-sm font-semibold text-muted-foreground">
                {partie.mode === "jour" ? `Défi n° ${partie.numero}` : "Partie libre"}
            </p>
            {/* Pas d'Azimut ici : ses chiffres sont elzéviriens, et son « 1 » se
                lit comme un « I ». */}
            <h1 className="mt-1 text-balance text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[38px]">
                <span className="tabular-nums">
                    {score} village{score > 1 ? "s" : ""} sur {resultats.length}
                </span>
            </h1>

            <ol className="mt-5 divide-y divide-border rounded-xl border border-border">
                {partie.manches.map((m, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-3">
                        <span
                            className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white",
                                resultats[i] ? "bg-succes-500" : "bg-marque-rouge-500",
                            )}
                        >
                            {resultats[i] ? (
                                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-label="Trouvé" />
                            ) : (
                                <X className="h-3.5 w-3.5" strokeWidth={3} aria-label="Manqué" />
                            )}
                        </span>
                        <span lang="gsw" className="min-w-0 flex-1 truncate font-bold text-foreground">
                            {m.formes.join(" · ")}
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground">{m.revelation?.village.nom}</span>
                    </li>
                ))}
            </ol>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                {partie.mode === "jour" && partie.numero !== null && (
                    <BoutonPartager numero={partie.numero} resultats={resultats} />
                )}
                {!partie.invite && (
                    <button
                        type="button"
                        onClick={rejouer}
                        disabled={enCours}
                        className={cn(
                            "inline-flex h-11 items-center rounded-lg px-5 text-[15px] font-semibold transition-colors disabled:opacity-60",
                            partie.mode === "jour"
                                ? "border border-bordure-forte text-foreground hover:bg-neutre-50"
                                : "bg-marque-rouge-500 text-white hover:bg-marque-rouge-600",
                        )}
                    >
                        {enCours ? "Chargement…" : partie.mode === "jour" ? "Partie libre" : "Rejouer"}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onQuitter}
                    className="inline-flex h-11 items-center rounded-lg px-4 text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-neutre-100 hover:text-foreground"
                >
                    Retour
                </button>
            </div>

            {partie.invite ? <InvitationCompte className="mt-10 border-t border-border pt-6" /> : <ChezToi mode={partie.mode} />}
        </>
    );
}

/** Ce qu'un compte ajoute au jeu, pour qui joue sans. */
export function InvitationCompte({ className }: { className?: string }) {
    return (
        <section aria-labelledby="compte-titre" className={className}>
            <h2 id="compte-titre" className="text-[15px] font-bold text-foreground">
                Avec un compte
            </h2>
            <p className="mt-1 max-w-[56ch] text-sm leading-[1.5] text-muted-foreground">
                Tu gardes ta série de jours, tu lances autant de parties libres que tu veux, et tu
                peux dire comment on parle dans ton village.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                    href={URL_INSCRIPTION_ODOO}
                    className="inline-flex h-10 items-center rounded-lg border border-bordure-forte px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
                >
                    Créer un compte
                </a>
                <Link
                    href="/login"
                    className="inline-flex min-h-10 items-center text-sm font-semibold text-marque-rouge-texte underline-offset-4 hover:underline"
                >
                    Se connecter
                </Link>
            </div>
        </section>
    );
}

/** Les cases du résultat, à l'écran. */
export function Cases({ resultats, className }: { resultats: boolean[]; className?: string }) {
    return (
        <p className={cn("flex gap-1.5", className)}>
            <span className="sr-only">
                {resultats.map((r, i) => `Manche ${i + 1} ${r ? "trouvée" : "manquée"}`).join(", ")}
            </span>
            {resultats.map((r, i) => (
                <span
                    key={i}
                    aria-hidden
                    className={cn("h-5 w-5 rounded-[5px]", r ? "bg-succes-500" : "bg-neutre-300")}
                />
            ))}
        </p>
    );
}

function ChezToi({ mode }: { mode: "jour" | "libre" }) {
    const { session } = useAuth();
    // En partie libre, un mot neuf à chaque bilan ; la clé change donc avec lui.
    const [tirage] = useState(() => (mode === "jour" ? "jour" : String(Math.random())));
    const { donnees: mot, premierChargement, rafraichir } = useListeMemorisee<LemmeDetaille | null>({
        cle: session ? cleCache("jeu-chez-toi", session.membreId, tirage) : null,
        charger: () => motChezToiAction(mode),
    });

    return (
        <section aria-labelledby="chez-toi-titre" className="mt-10 border-t border-border pt-6">
            <h2 id="chez-toi-titre" className="text-lg font-extrabold text-foreground">
                Et chez toi, on dit comment ?
            </h2>
            {premierChargement ? (
                <div className="mt-3">
                    <ListSkeleton lignes={2} />
                </div>
            ) : !mot ? null : (
                <>
                    <p className="mt-1 max-w-[56ch] text-sm leading-[1.5] text-muted-foreground">
                        Pour dire <span className="font-semibold text-foreground">{mot.francais}</span>, si tu
                        reconnais une forme, attache-lui ton village. Rien ne t&apos;y oblige, et ça ne compte
                        pas dans le score.
                    </p>
                    <ul className="mt-3 space-y-2">
                        {mot.variantes.map((v) => (
                            <li key={v.id} className="flex items-center justify-between gap-3">
                                <span lang="gsw" className="min-w-0 text-[17px] font-bold text-foreground">
                                    {v.forme}
                                </span>
                                <VoteVariante varianteId={v.id} monVote={v.monVote ?? false} onSucces={rafraichir} />
                            </li>
                        ))}
                    </ul>
                    <NouvelleVariante lemmeId={mot.id} onSucces={rafraichir} />
                </>
            )}
        </section>
    );
}

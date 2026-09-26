"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Flame } from "lucide-react";
import { toast } from "sonner";

import {
    commencerDefiInviteAction,
    commencerPartieAction,
    etatJeuAction,
    type EtatJeu,
    type PartiePublique,
} from "@/app/actions/jeu";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/components/auth-provider";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { cleCache } from "@/lib/cache-navigation";
import { cn } from "@/lib/utils";

import { Cases, InvitationCompte } from "./bilan";
import { BoutonPartager } from "./partage";
import { Partie } from "./partie";

// L'écran du jeu (25/09/2026) : l'accueil (défi du jour, partie libre), puis
// la partie, puis le bilan, sans changer d'URL. Une partie en cours vit en
// base : la quitter et revenir la reprend à la manche où on l'a laissée.
//
// Sans compte (26/09/2026), seul le défi du jour se joue, et rien n'en reste.
// Pas de rail de navigation : tous ses onglets mènent à des pages réservées.

type Vue = { type: "accueil" } | { type: "partie"; partie: PartiePublique };

export function EcranJeu() {
    const { session } = useAuth();
    const invite = !session;
    const [vue, setVue] = useState<Vue>({ type: "accueil" });

    const { donnees: etat, premierChargement, rafraichir } = useListeMemorisee<EtatJeu>({
        cle: cleCache("jeu-etat", session?.membreId ?? "invite"),
        charger: etatJeuAction,
    });

    function revenir() {
        setVue({ type: "accueil" });
        void rafraichir();
        window.scrollTo({ top: 0 });
    }

    return (
        <div className={cn("flex min-h-screen flex-col", !invite && "pb-16 md:pb-0 md:pl-20 lg:pl-56")}>
            {invite ? (
                <AppHeader variant="stack" titre="Jeu" backHref="/" />
            ) : (
                <AppHeader variant="root" actif="jeu" titre="Jeu" />
            )}

            <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10 pt-[18px]">
                {vue.type === "partie" ? (
                    <Partie
                        key={vue.partie.id}
                        initiale={vue.partie}
                        onQuitter={revenir}
                        onRejouer={(p) => setVue({ type: "partie", partie: p })}
                    />
                ) : premierChargement || !etat ? (
                    <ListSkeleton lignes={3} />
                ) : (
                    <Accueil etat={etat} invite={invite} onPartie={(p) => setVue({ type: "partie", partie: p })} />
                )}
            </main>
        </div>
    );
}

function Accueil({
    etat,
    invite,
    onPartie,
}: {
    etat: EtatJeu;
    invite: boolean;
    onPartie: (p: PartiePublique) => void;
}) {
    const [enCours, demarrer] = useTransition();
    const [mode, setMode] = useState<"jour" | "libre" | null>(null);

    function commencer(m: "jour" | "libre") {
        setMode(m);
        demarrer(async () => {
            const res = invite ? await commencerDefiInviteAction() : await commencerPartieAction(m);
            if (res.succes) {
                onPartie(res.valeur);
                window.scrollTo({ top: 0 });
            } else {
                toast.error(res.erreur);
            }
        });
    }

    const { defi } = etat;

    return (
        <>
            <h1 className="text-balance font-display text-[30px] leading-[1.15] text-foreground sm:text-[38px]">
                Le défi du jour
            </h1>
            {/* Titre global, décision de John du 25/09/2026 : le jeu accueillera
                d'autres types de manches (mots, prénoms). « Quel village dit
                ça ? » est la consigne d'un type, pas le nom du jeu. */}
            <p className="mt-2 max-w-[56ch] text-[15px] leading-[1.55] text-muted-foreground">
                Des formes alsaciennes attestées. À toi de retrouver ce qu&apos;elles disent.
            </p>

            <section
                aria-labelledby="defi-titre"
                className="mt-7 rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_8px_24px_-12px_hsl(var(--foreground)/0.12)]"
            >
                <div className="flex items-baseline justify-between gap-3">
                    <h2 id="defi-titre" className="text-lg font-extrabold text-foreground">
                        Défi <span className="tabular-nums">n° {etat.numero}</span>
                    </h2>
                    {etat.serie > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-marque-or-700">
                            <Flame className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                            {etat.serie} jour{etat.serie > 1 ? "s" : ""} de suite
                        </span>
                    )}
                </div>

                {defi.etat === "finie" ? (
                    <>
                        <p className="mt-2 text-[15px] text-foreground">
                            Tu as trouvé{" "}
                            <strong className="tabular-nums">
                                {defi.resultats.filter(Boolean).length} village
                                {defi.resultats.filter(Boolean).length > 1 ? "s" : ""} sur {defi.resultats.length}
                            </strong>
                            . Le prochain défi arrive demain.
                        </p>
                        <Cases resultats={defi.resultats} className="mt-3" />
                        <div className="mt-4">
                            <BoutonPartager numero={etat.numero} resultats={defi.resultats} />
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mt-2 text-[15px] leading-[1.5] text-muted-foreground">
                            {defi.etat === "en_cours"
                                ? `Ta partie t'attend à la manche ${defi.manche} sur 5.`
                                : "Quel village dit ça ? Cinq noms alsaciens, du plus transparent au plus coriace. Le même défi pour tout le monde aujourd'hui."}
                        </p>
                        <button
                            type="button"
                            onClick={() => commencer("jour")}
                            disabled={enCours}
                            className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-marque-rouge-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-60"
                        >
                            {enCours && mode === "jour"
                                ? "Chargement…"
                                : defi.etat === "en_cours"
                                  ? "Reprendre le défi"
                                  : "Jouer le défi du jour"}
                            <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                        </button>
                    </>
                )}
            </section>

            {invite ? (
                <InvitationCompte className="mt-8" />
            ) : (
                <section aria-labelledby="libre-titre" className="mt-8">
                    <h2 id="libre-titre" className="text-[15px] font-bold text-foreground">
                        Partie libre
                    </h2>
                    <p className="mt-1 max-w-[56ch] text-sm leading-[1.5] text-muted-foreground">
                        Autant de parties que tu veux, tirées au hasard. Elles ne comptent pas dans ta
                        série.
                    </p>
                    <button
                        type="button"
                        onClick={() => commencer("libre")}
                        disabled={enCours}
                        className="mt-3 inline-flex h-10 items-center rounded-lg border border-bordure-forte px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50 disabled:opacity-60"
                    >
                        {enCours && mode === "libre" ? "Chargement…" : "Lancer une partie libre"}
                    </button>
                </section>
            )}
        </>
    );
}

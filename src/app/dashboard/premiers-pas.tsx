"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MapPin, Plus } from "lucide-react";

import { premiersMotsAction, type PremierMot } from "@/app/actions/premiers-pas";
import { retirerVoteAction, voterPourVarianteAction } from "@/app/actions/votes";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { cleCache } from "@/lib/cache-navigation";
import { signalerEchecContribution } from "@/lib/toast-contribution";
import { cn } from "@/lib/utils";
import { VillageProfil } from "./village-profil";

// Le premier parcours d'un membre (24/09/2026). Le locuteur est prioritaire
// (décision de John du même jour), et « Mon espace » laissait un nouveau venu
// devant deux compteurs à zéro et un choix de village sans suite.
//
// Deux gestes, dans l'ordre où le produit les exige : choisir son village, puis
// reconnaître une forme. Rien n'est un exercice : chaque clic est le vrai vote,
// et le moment qui compte (« ta forme se dit maintenant chez toi ») renvoie sur
// la carte du mot. Aucun état de parcours n'est stocké : c'est « Mon espace »
// qui décide de l'afficher, d'après ce que le membre a déjà fait.

export function PremiersPas({
    membreId,
    village,
    onVillageDefini,
    onContribution,
}: {
    membreId: string;
    village: string | null;
    onVillageDefini: () => void;
    onContribution: () => void;
}) {
    const [reussite, setReussite] = useState<{ forme: string; francais: string; lemmeId: string } | null>(null);

    return (
        <section aria-labelledby="premiers-pas-titre" className="mt-[26px] max-w-2xl">
            <h2 id="premiers-pas-titre" className="text-balance text-xl font-extrabold text-foreground">
                Fais entrer ton village dans le dico
            </h2>
            <p className="mt-1.5 max-w-[60ch] text-sm leading-[1.55] text-muted-foreground">
                Deux gestes. Chaque forme que tu reconnais porte ensuite ton village, et
                ton village apparaît sur la carte de ce mot.
            </p>

            <ol className="mt-5">
                <Etape numero={1} fait={village !== null} titre="D'où vient ton alsacien ?">
                    {village === null && (
                        <p className="mt-1 text-sm leading-[1.5] text-muted-foreground">
                            Le village où tu as appris à le parler. Il se choisit dans la liste,
                            rien n&apos;est déduit de ta position.
                        </p>
                    )}
                    <VillageProfil villageActuel={village} onDefini={onVillageDefini} />
                </Etape>

                <Etape
                    numero={2}
                    fait={reussite !== null}
                    titre="Lequel dis-tu chez toi ?"
                    dernier
                    inactif={village === null}
                >
                    {village === null ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Dès que ton village est choisi.
                        </p>
                    ) : (
                        <>
                            {reussite && <Reussite {...reussite} village={village} />}
                            <PremiersMots
                                membreId={membreId}
                                onVote={(r) => {
                                    if (r) setReussite((avant) => avant ?? r);
                                    onContribution();
                                }}
                            />
                        </>
                    )}
                </Etape>
            </ol>
        </section>
    );
}

function Etape({
    numero,
    titre,
    fait,
    dernier = false,
    inactif = false,
    children,
}: {
    numero: number;
    titre: string;
    fait: boolean;
    dernier?: boolean;
    inactif?: boolean;
    children: React.ReactNode;
}) {
    return (
        <li className="relative flex gap-3.5 pb-6 last:pb-0">
            {/* Le fil qui relie les deux étapes : l'ordre compte, le vote exige
                le village. */}
            {!dernier && (
                <span aria-hidden className="absolute bottom-0 left-[13px] top-8 w-px bg-border" />
            )}
            <span
                aria-hidden
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums transition-colors duration-300",
                    fait
                        ? "bg-succes-500 text-white"
                        : inactif
                          ? "border border-border text-muted-foreground"
                          : "bg-foreground text-background",
                )}
            >
                {fait ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : numero}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
                <h3 className={cn("text-[15px] font-bold", inactif ? "text-muted-foreground" : "text-foreground")}>
                    <span className="sr-only">
                        Étape {numero}{fait ? ", faite" : ""} :{" "}
                    </span>
                    {titre}
                </h3>
                {children}
            </div>
        </li>
    );
}

function PremiersMots({
    membreId,
    onVote,
}: {
    membreId: string;
    onVote: (reussite: { forme: string; francais: string; lemmeId: string } | null) => void;
}) {
    const { donnees, premierChargement, rafraichir } = useListeMemorisee<PremierMot[]>({
        cle: cleCache("premiers-mots", membreId),
        charger: premiersMotsAction,
    });

    if (premierChargement || !donnees) {
        return (
            <div className="mt-3">
                <ListSkeleton lignes={3} />
            </div>
        );
    }

    return (
        <div className="mt-3 space-y-4">
            {donnees.map((mot) => (
                <div key={mot.id}>
                    <p className="text-sm text-muted-foreground">
                        Pour dire <span className="font-semibold text-foreground">{mot.francais}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {mot.formes.map((f) => (
                            <PuceForme
                                key={f.id}
                                varianteId={f.id}
                                forme={f.forme}
                                monVote={f.monVote}
                                onFait={(vote) => {
                                    rafraichir();
                                    onVote(vote ? { forme: f.forme, francais: mot.francais, lemmeId: mot.id } : null);
                                }}
                            />
                        ))}
                    </div>
                    <Link
                        href={`/entree/${mot.id}`}
                        className="mt-2 inline-flex min-h-9 items-center text-[13px] font-semibold text-marque-rouge-texte underline-offset-4 hover:underline"
                    >
                        Ça se dit autrement chez moi
                    </Link>
                </div>
            ))}
        </div>
    );
}

function PuceForme({
    varianteId,
    forme,
    monVote,
    onFait,
}: {
    varianteId: string;
    forme: string;
    monVote: boolean;
    onFait: (vote: boolean) => void;
}) {
    const router = useRouter();
    const [enCours, demarrer] = useTransition();

    function basculer() {
        demarrer(async () => {
            const res = monVote ? await retirerVoteAction(varianteId) : await voterPourVarianteAction(varianteId);
            if (res.succes) onFait(!monVote);
            else signalerEchecContribution(res, () => router.push("/dashboard"));
        });
    }

    return (
        <button
            type="button"
            onClick={basculer}
            disabled={enCours}
            aria-pressed={monVote}
            className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-colors disabled:opacity-60",
                monVote
                    ? "bg-succes-100 text-succes-500"
                    : "border border-bordure-forte text-foreground hover:bg-neutre-50",
            )}
        >
            {monVote ? (
                <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden />
            ) : (
                <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            )}
            <span lang="gsw">{forme}</span>
        </button>
    );
}

function Reussite({
    forme,
    francais,
    lemmeId,
    village,
}: {
    forme: string;
    francais: string;
    lemmeId: string;
    village: string;
}) {
    return (
        <div
            role="status"
            className="mt-3 rounded-lg bg-succes-100 p-4 motion-safe:duration-500 motion-safe:ease-out motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
        >
            <p className="text-[15px] font-bold text-foreground">
                « <span lang="gsw">{forme}</span> » se dit maintenant à {village}.
            </p>
            <p className="mt-1 text-sm leading-[1.5] text-foreground/80">
                Ton village est sur la carte de « {francais} ». Continue avec les autres
                mots, ou va voir d&apos;où parlent les autres.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                <Link
                    href={`/carte?mot=${lemmeId}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-marque-rouge-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600"
                >
                    <MapPin className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    Voir sur la carte
                </Link>
                <Link
                    href="/dictionnaire"
                    className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-foreground transition-colors hover:bg-background/60"
                >
                    Parcourir le dictionnaire
                </Link>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";

import {
    repondreAction,
    repondreInviteAction,
    type ManchePublique,
    type PartiePublique,
    type Resultat,
    type Revelation,
} from "@/app/actions/jeu";
import { BadgeConfiance } from "@/components/badge-confiance";
import type { PointParler } from "@/components/carte-parlers";
import { LIBELLES_DEPARTEMENT } from "@/lib/dictionnaire";
import { cn } from "@/lib/utils";

import { Bilan } from "./bilan";

// `ssr: false` : Leaflet lit `window` à l'import (même raison que /carte).
const CarteParlers = dynamic(() => import("@/components/carte-parlers").then((m) => m.CarteParlers), {
    ssr: false,
    loading: () => <div className="h-40 rounded-lg bg-neutre-50" />,
});

type ResultatReponse = Resultat<{ revelation: Revelation; score: number; finie: boolean }>;

// Une partie : cinq manches, puis le bilan. La réponse d'une manche n'est connue
// du navigateur qu'une fois donnée (`repondreAction`) ; avant, il n'a que les
// formes et les quatre choix.

export function Partie({
    initiale,
    onQuitter,
    onRejouer,
}: {
    initiale: PartiePublique;
    onQuitter: () => void;
    onRejouer: (p: PartiePublique) => void;
}) {
    const [partie, setPartie] = useState(initiale);
    // On reprend à la première manche sans réponse. Une manche répondue reste à
    // l'écran (sa révélation) jusqu'à ce que le membre passe à la suivante.
    const [indice, setIndice] = useState(() => {
        const i = initiale.manches.findIndex((m) => m.revelation === null);
        return i === -1 ? initiale.manches.length : i;
    });

    const total = partie.manches.length;

    async function repondre(i: number, id: number): Promise<ResultatReponse> {
        if (!partie.invite) return repondreAction(partie.id, i, id);
        // Invité : rien en base, le score se tient ici.
        const res = await repondreInviteAction(partie.invite, i, id);
        if (!res.succes) return res;
        const r = res.valeur;
        return {
            succes: true,
            valeur: { revelation: r, score: partie.score + (r.reponseId === r.bonneId ? 1 : 0), finie: i === total - 1 },
        };
    }

    if (indice >= total) {
        return <Bilan partie={partie} onQuitter={onQuitter} onRejouer={onRejouer} />;
    }

    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-muted-foreground">
                    {partie.mode === "jour" ? `Défi n° ${partie.numero}` : "Partie libre"}
                    <span aria-hidden> · </span>
                    <span className="tabular-nums">
                        Manche {indice + 1} sur {total}
                    </span>
                </p>
                <button
                    type="button"
                    onClick={onQuitter}
                    className="inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-neutre-100 hover:text-foreground"
                >
                    Quitter
                </button>
            </div>
            <Progression manches={partie.manches} indice={indice} />

            <Manche
                key={indice}
                repondre={(id) => repondre(indice, id)}
                manche={partie.manches[indice]}
                derniere={indice === total - 1}
                onReponse={(revelation, score, finie) =>
                    setPartie((p) => ({
                        ...p,
                        score,
                        finie,
                        manches: p.manches.map((m, i) => (i === indice ? { ...m, revelation } : m)),
                    }))
                }
                onSuivante={() => {
                    setIndice((i) => i + 1);
                    window.scrollTo({ top: 0 });
                }}
            />
        </>
    );
}

function Progression({ manches, indice }: { manches: ManchePublique[]; indice: number }) {
    return (
        <ol className="mt-2 flex gap-1.5" aria-label="Progression">
            {manches.map((m, i) => {
                const r = m.revelation;
                const etat = r ? (r.reponseId === r.bonneId ? "trouvee" : "manquee") : i === indice ? "courante" : "a_venir";
                return (
                    <li
                        key={i}
                        className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors duration-300",
                            etat === "trouvee" && "bg-succes-500",
                            etat === "manquee" && "bg-marque-rouge-400",
                            etat === "courante" && "bg-foreground",
                            etat === "a_venir" && "bg-neutre-300",
                        )}
                    >
                        <span className="sr-only">
                            Manche {i + 1} :{" "}
                            {etat === "trouvee" ? "trouvée" : etat === "manquee" ? "manquée" : etat === "courante" ? "en cours" : "à venir"}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function Manche({
    repondre: envoyer,
    manche,
    derniere,
    onReponse,
    onSuivante,
}: {
    repondre: (id: number) => Promise<ResultatReponse>;
    manche: ManchePublique;
    derniere: boolean;
    onReponse: (r: Revelation, score: number, finie: boolean) => void;
    onSuivante: () => void;
}) {
    const [enCours, demarrer] = useTransition();
    const [choisi, setChoisi] = useState<number | null>(manche.revelation?.reponseId ?? null);
    const revelation = manche.revelation;
    const titreRef = useRef<HTMLHeadingElement>(null);
    const suiteRef = useRef<HTMLButtonElement>(null);
    const revelationRef = useRef<HTMLDivElement>(null);

    function repondre(id: number) {
        if (revelation || enCours) return;
        setChoisi(id);
        demarrer(async () => {
            const res = await envoyer(id);
            if (res.succes) onReponse(res.valeur.revelation, res.valeur.score, res.valeur.finie);
            else {
                setChoisi(null);
                toast.error(res.erreur);
            }
        });
    }

    // Le focus suit la partie : sur la question à l'arrivée d'une manche, sur
    // la suite une fois la réponse révélée. Au clavier, 1 à 4 répondent.
    useEffect(() => {
        titreRef.current?.focus({ preventScroll: true });
    }, []);
    // Sur téléphone, la révélation tombe sous le pli : on la fait remonter au
    // lieu de laisser le membre chercher ce qui vient de se passer.
    useEffect(() => {
        if (!revelation) return;
        suiteRef.current?.focus({ preventScroll: true });
        // `scrollIntoView({ block: "nearest" })` ne bouge presque pas quand la
        // révélation est plus haute que l'écran (vu à 375 px) : on la place
        // nous-mêmes vers 40 % de la hauteur, les choix colorés restant en
        // partie visibles au-dessus. Rien ne bouge si elle est déjà en vue.
        const haut = revelationRef.current?.getBoundingClientRect().top;
        if (haut === undefined || haut < window.innerHeight * 0.6) return;
        const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollBy({ top: haut - window.innerHeight * 0.4, behavior: calme ? "auto" : "smooth" });
    }, [revelation]);
    useEffect(() => {
        if (revelation) return;
        function touche(e: KeyboardEvent) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const n = Number(e.key);
            if (n >= 1 && n <= manche.choix.length) repondre(manche.choix[n - 1].id);
        }
        window.addEventListener("keydown", touche);
        return () => window.removeEventListener("keydown", touche);
    });

    return (
        <div className="mt-7">
            <h2 ref={titreRef} tabIndex={-1} className="outline-none">
                <span className="sr-only">Quel village dit : </span>
                <span
                    lang="gsw"
                    className="block text-balance break-words font-display text-[34px] leading-[1.12] text-foreground motion-safe:duration-500 motion-safe:ease-out motion-safe:animate-in motion-safe:fade-in-0 sm:text-[44px]"
                >
                    {manche.formes.map((f, i) => (
                        <span key={f}>
                            {i > 0 && <span className="text-muted-foreground/60"> · </span>}
                            {f}
                        </span>
                    ))}
                </span>
            </h2>
            <p aria-hidden className="mt-3 text-[15px] font-semibold text-muted-foreground">
                Quel village dit ça ?
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {manche.choix.map((c, n) => {
                    const estBon = revelation?.bonneId === c.id;
                    const estChoisi = choisi === c.id;
                    const etat = revelation
                        ? estBon
                            ? "bon"
                            : estChoisi
                              ? "faux"
                              : "eteint"
                        : estChoisi
                          ? "attente"
                          : "libre";
                    return (
                        <li key={c.id}>
                            <button
                                type="button"
                                onClick={() => repondre(c.id)}
                                disabled={!!revelation || enCours}
                                aria-pressed={estChoisi}
                                className={cn(
                                    "flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-[background-color,border-color,opacity] duration-200",
                                    etat === "libre" && "border-bordure-forte bg-background hover:border-foreground hover:bg-neutre-50",
                                    etat === "attente" && "border-foreground bg-neutre-50",
                                    etat === "bon" && "border-succes-500 bg-succes-100",
                                    etat === "faux" && "border-marque-rouge-400 bg-marque-rouge-50",
                                    etat === "eteint" && "border-border opacity-55",
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                                        etat === "bon"
                                            ? "bg-succes-500 text-white"
                                            : etat === "faux"
                                              ? "bg-marque-rouge-500 text-white"
                                              : "bg-neutre-100 text-muted-foreground",
                                    )}
                                >
                                    {etat === "bon" ? (
                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                    ) : etat === "faux" ? (
                                        <X className="h-3.5 w-3.5" strokeWidth={3} />
                                    ) : (
                                        n + 1
                                    )}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[15px] font-semibold text-foreground">{c.nom}</span>
                                    <span className="block text-xs text-muted-foreground">
                                        {LIBELLES_DEPARTEMENT[c.departement] ?? c.departement}
                                    </span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {revelation && (
                <div ref={revelationRef}>
                    <Reponse revelation={revelation}>
                        <button
                            ref={suiteRef}
                            type="button"
                            onClick={onSuivante}
                            className="inline-flex h-11 items-center gap-2 rounded-lg bg-marque-rouge-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600"
                        >
                            {derniere ? "Voir le bilan" : "Manche suivante"}
                            <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                        </button>
                    </Reponse>
                </div>
            )}
        </div>
    );
}

function Reponse({ revelation, children }: { revelation: Revelation; children: React.ReactNode }) {
    const { village, variantes } = revelation;
    const trouve = revelation.reponseId === revelation.bonneId;
    const departement = LIBELLES_DEPARTEMENT[village.departement] ?? village.departement;

    // Un seul point : le village, là où il est. Mémoïsé, sinon la carte
    // reposerait son marqueur à chaque rendu.
    const points = useMemo<PointParler[]>(
        () => [
            {
                id: revelation.bonneId,
                nom: village.nom,
                latitude: village.latitude,
                longitude: village.longitude,
                formes: variantes.map((v) => v.forme),
            },
        ],
        [revelation.bonneId, village, variantes],
    );

    return (
        <section
            aria-live="polite"
            className="mt-6 motion-safe:duration-500 motion-safe:ease-out motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
        >
            <p className="text-lg font-extrabold text-foreground">
                {trouve ? "Bien vu, c'est " : "Raté, c'était "}
                {village.nom}
                <span className="font-semibold text-muted-foreground"> ({departement})</span>.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_12rem]">
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {variantes.length > 1 ? `Ses ${variantes.length} formes` : "Sa forme"}, et ce qui les fonde
                    </p>
                    <ul className="mt-2 space-y-2.5">
                        {variantes.map((v) => (
                            <li key={v.id}>
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                    <span lang="gsw" className="text-[17px] font-bold text-foreground">
                                        {v.forme}
                                    </span>
                                    <BadgeConfiance nbSources={v.nbSources} nbVillages={v.nbVillages} />
                                </div>
                                {v.sources.length > 0 && (
                                    <p className="mt-0.5 text-xs leading-[1.45] text-muted-foreground">
                                        {v.sources.map((s) => s.nom).join(", ")}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <CarteParlers points={points} className="h-40 overflow-hidden rounded-lg border border-border sm:h-full sm:min-h-40" />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                {children}
                <Link
                    href={`/village/${village.slug}`}
                    className="inline-flex min-h-10 items-center text-sm font-semibold text-marque-rouge-texte underline-offset-4 hover:underline"
                >
                    La fiche de {village.nom}
                </Link>
            </div>
        </section>
    );
}

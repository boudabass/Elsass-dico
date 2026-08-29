"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { AppHeader } from "@/components/app-header";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Loader2, PenLine, Shield, ArrowRight } from "lucide-react";
import {
    listerMesContributions,
    chargerStatistiquesContributeur,
    type MaContribution,
    type StatistiquesContributeur,
} from "@/app/actions/contributions";
import { listerCandidats } from "@/app/actions/arbitrage";
import { URL_FORUM_DICTIONNAIRE } from "@/lib/liens-externes";

// Écran 6 (3 variantes) du handoff mobile : "Mon espace" remplace le
// Dashboard + Profil du 25/08 en un seul écran, rendu conditionnel sur le
// rôle — 6a lecteur, 6b contributeur, 6c admin (+ teaser d'arbitrage).
//
// Différence assumée avec le mockup : le CTA "Devenir contributeur" (6a) n'a
// pas d'action self-service dans ce projet (les rôles sont assignés par un
// admin, cf. CLAUDE.md) — il pointe vers le forum plutôt qu'un flux inventé.
// La carte "À arbitrer" (6c) montre un bouton "Promouvoir" sur une variante
// d'une entrée déjà publiée dans le mockup ; ce geste n'existe dans aucune
// action actuelle et sortirait du périmètre de ce chantier — remplacée par
// un teaser (nombre de candidats + lien vers la file complète).
export default function MonEspacePage() {
    const { user, role, isLoading, signOut } = useAuth();
    const [mesContributions, setMesContributions] = useState<MaContribution[]>([]);
    const [stats, setStats] = useState<StatistiquesContributeur | null>(null);
    const [candidatsEnAttente, setCandidatsEnAttente] = useState<number | null>(null);
    const [chargement, setChargement] = useState(true);

    const estContributeur = role === "contributeur" || role === "admin";
    const estAdmin = role === "admin";

    useEffect(() => {
        if (!user || !estContributeur) {
            setChargement(false);
            return;
        }
        let annule = false;
        setChargement(true);
        (async () => {
            const miennes = await listerMesContributions();
            const [statistiques, candidats] = await Promise.all([
                chargerStatistiquesContributeur(miennes),
                estAdmin ? listerCandidats() : Promise.resolve(null),
            ]);
            if (annule) return;
            setMesContributions(miennes);
            setStats(statistiques);
            if (candidats) setCandidatsEnAttente(candidats.length);
            setChargement(false);
        })();
        return () => {
            annule = true;
        };
    }, [user, estContributeur, estAdmin]);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = "/";
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutre-400" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
            <AppHeader variant="root" actif="compte" titre="Mon espace" />

            <main className="flex-1 px-4 pt-[18px] pb-8">
                {!user ? (
                    <div className="flex flex-col items-center pt-10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Connecte-toi pour accéder à ton espace.
                        </p>
                        <Link
                            href="/login"
                            className="mt-4 flex h-11 items-center justify-center rounded-lg bg-marque-rouge-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600"
                        >
                            Se connecter
                        </Link>
                    </div>
                ) : (
                    <>
                        <IdentiteRow email={user.email ?? ""} role={role} />

                        {!estContributeur ? (
                            <div className="mt-[22px] rounded-lg border border-border bg-card p-4">
                                <p className="text-[15px] font-bold text-foreground">
                                    Envie de compléter le dictionnaire ?
                                </p>
                                <p className="mt-1.5 mb-3.5 text-sm leading-[1.5] text-muted-foreground">
                                    Deviens contributeur pour proposer des mots et voter sur les traductions de
                                    la communauté.
                                </p>
                                <a
                                    href={URL_FORUM_DICTIONNAIRE}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-11 w-full items-center justify-center rounded-lg bg-marque-rouge-500 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600"
                                >
                                    Devenir contributeur
                                </a>
                            </div>
                        ) : chargement ? (
                            <div className="mt-[22px]">
                                <ListSkeleton lignes={2} />
                            </div>
                        ) : (
                            <>
                                <div className="mt-[18px] grid grid-cols-3 gap-2">
                                    <StatCase valeur={stats?.propositions ?? 0} libelle="propositions" />
                                    <StatCase valeur={stats?.votes ?? 0} libelle="votes" />
                                    <StatCase valeur={stats?.promotions ?? 0} libelle="promotions" />
                                </div>

                                {estAdmin && (
                                    <>
                                        <p className="mb-2.5 mt-[22px] text-xs font-bold uppercase tracking-wide text-neutre-400">
                                            À arbitrer
                                        </p>
                                        <Link
                                            href="/admin/arbitrage"
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5"
                                        >
                                            <span className="text-sm text-foreground">
                                                {candidatsEnAttente === null
                                                    ? "…"
                                                    : candidatsEnAttente >= 50
                                                        ? "50+ candidats en attente"
                                                        : candidatsEnAttente === 0
                                                            ? "Aucun candidat en attente"
                                                            : `${candidatsEnAttente} candidat${candidatsEnAttente > 1 ? "s" : ""} en attente`}
                                            </span>
                                            <span className="flex items-center gap-1 text-sm font-semibold text-marque-rouge-texte">
                                                Voir la file <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </Link>
                                    </>
                                )}

                                <p className="mb-2.5 mt-[22px] text-xs font-bold uppercase tracking-wide text-neutre-400">
                                    Mes dernières contributions
                                </p>
                                {mesContributions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Aucune proposition pour l&apos;instant.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {mesContributions.slice(0, 2).map((c) => (
                                            <div
                                                key={c.id}
                                                className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0"
                                            >
                                                <span className="truncate text-[15px] font-semibold text-foreground">
                                                    {c.francais} → {c.alsacien}
                                                </span>
                                                <span
                                                    className={
                                                        c.retenue
                                                            ? "shrink-0 rounded-full bg-succes-100 px-2.5 py-0.5 text-xs font-semibold text-succes-500"
                                                            : "shrink-0 rounded-full bg-attention-100 px-2.5 py-0.5 text-xs font-semibold text-attention-500"
                                                    }
                                                >
                                                    {c.retenue ? "Validée" : "En attente"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="mt-6 h-11 w-full text-sm font-semibold text-marque-rouge-texte"
                        >
                            Se déconnecter
                        </button>
                    </>
                )}
            </main>
        </div>
    );
}

function IdentiteRow({ email, role }: { email: string; role: string | null }) {
    const initiales = email.substring(0, 2).toUpperCase();
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-foreground text-[17px] font-bold text-background">
                {initiales}
            </div>
            <div className="min-w-0">
                <p className="truncate text-[17px] font-bold text-foreground">{email}</p>
                <RolePill role={role} />
            </div>
        </div>
    );
}

function RolePill({ role }: { role: string | null }) {
    if (role === "admin") {
        return (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">
                <Shield className="h-2.5 w-2.5" strokeWidth={3} /> Admin
            </span>
        );
    }
    if (role === "contributeur") {
        return (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-marque-or-50 px-2.5 py-0.5 text-xs font-semibold text-marque-or-700">
                <PenLine className="h-2.5 w-2.5" strokeWidth={3} /> Contributeur
            </span>
        );
    }
    return (
        <span className="mt-0.5 inline-flex items-center rounded-full bg-neutre-100 px-2.5 py-0.5 text-xs font-semibold text-neutre-600">
            Lecteur
        </span>
    );
}

function StatCase({ valeur, libelle }: { valeur: number; libelle: string }) {
    return (
        <div className="rounded-lg border border-border p-2.5 text-center">
            <div className="text-[19px] font-extrabold text-foreground">{valeur}</div>
            <div className="text-xs text-neutre-400">{libelle}</div>
        </div>
    );
}

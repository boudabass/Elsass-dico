"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Shield } from "lucide-react";

import { monEspaceAction, type MonEspace } from "@/app/actions/membres";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/components/auth-provider";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { cleCache } from "@/lib/cache-navigation";

// Écran 6 du handoff mobile : « Mon espace ».
//
// Réécrit le 12/09/2026. Les trois cases de statistiques (propositions / votes /
// promotions) mesuraient un circuit qui n'existe plus : plus de vote, plus de
// promotion, plus d'arbitrage. Deux chiffres les remplacent, et ils disent ce
// qu'un membre fait réellement dans le modèle actuel — combien de formes il a
// apportées, et à combien il a attaché son village.
//
// Le CTA « Devenir contributeur » disparaît lui aussi : il n'y a plus de rôle à
// obtenir. Tout membre contribue, c'était la raison d'être de ce rôle
// intermédiaire.
export default function MonEspacePage() {
    const { session, role, deconnexion } = useAuth();

    const { donnees, premierChargement } = useListeMemorisee<MonEspace | null>({
        cle: session ? cleCache("mon-espace", session.membreId) : null,
        charger: monEspaceAction,
    });

    const espace = donnees ?? null;
    const chargement = premierChargement || (session !== null && donnees === null);

    return (
        <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
            <AppHeader variant="root" actif="compte" titre="Mon espace" />

            <main className="flex-1 px-4 pt-[18px] pb-8">
                {!session ? (
                    // Le middleware redirige déjà un visiteur sans cookie ; ce cas
                    // ne se voit qu'en cours de déconnexion.
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
                        <Identite
                            nom={espace?.nom ?? session.nom}
                            email={espace?.email ?? session.email}
                            role={role}
                            village={espace?.village ?? null}
                        />

                        {chargement ? (
                            <div className="mt-[22px]">
                                <ListSkeleton lignes={2} />
                            </div>
                        ) : (
                            <div className="mt-[18px] grid grid-cols-2 gap-2">
                                {/* Deux comptes distincts, et pas un total : apporter
                                    une forme et dire d'où elle vient sont deux gestes
                                    différents. */}
                                <StatCase valeur={espace?.nbVariantes ?? 0} libelle="formes apportées" />
                                <StatCase valeur={espace?.nbTemoignages ?? 0} libelle="villages attachés" />
                            </div>
                        )}

                        {!chargement && !espace?.village && (
                            <div className="mt-[18px] rounded-lg border border-border bg-card p-4">
                                <p className="text-[15px] font-bold text-foreground">
                                    D&apos;où vient ton alsacien ?
                                </p>
                                <p className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">
                                    Choisir ton village permettra de rattacher les formes
                                    que tu reconnais. Le choix se fera dans une liste —
                                    rien n&apos;est déduit de ta position.
                                </p>
                            </div>
                        )}

                        {role === "admin" && (
                            <>
                                <p className="mb-2.5 mt-[22px] text-xs font-bold uppercase tracking-wide text-neutre-400">
                                    Administration
                                </p>
                                <Link
                                    href="/admin"
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5"
                                >
                                    <span className="text-sm text-foreground">Membres</span>
                                    <span className="flex items-center gap-1 text-sm font-semibold text-marque-rouge-texte">
                                        Ouvrir <ArrowRight className="h-3.5 w-3.5" />
                                    </span>
                                </Link>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={deconnexion}
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

function Identite({
    nom,
    email,
    role,
    village,
}: {
    nom: string | null;
    email: string;
    role: string | null;
    village: string | null;
}) {
    const initiales = (nom ?? email).substring(0, 2).toUpperCase();
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-foreground text-[17px] font-bold text-background">
                {initiales}
            </div>
            <div className="min-w-0">
                <p className="truncate text-[17px] font-bold text-foreground">{nom ?? email}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                    <RolePill role={role} />
                    {village && (
                        <span className="inline-flex items-center gap-1 text-xs text-neutre-400">
                            <MapPin className="h-3 w-3" strokeWidth={2.4} />
                            {village}
                        </span>
                    )}
                </div>
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
    return (
        <span className="mt-0.5 inline-flex items-center rounded-full bg-neutre-100 px-2.5 py-0.5 text-xs font-semibold text-neutre-600">
            Membre
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

"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { AppHeader } from "@/components/app-header";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Check, Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import {
    listerMesContributions,
    listerContributionsAValider,
    supprimerContributionAction,
    voterAction,
    retirerVoteAction,
    type MaContribution,
    type ContributionAValider,
} from "@/app/actions/contributions";
import { LIBELLES_TYPE_TERME, SCORE_PLEIN, type TypeTerme } from "@/lib/dictionnaire";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { useScrollMemorise } from "@/hooks/use-scroll-memorise";
import { cleCache, invaliderCache } from "@/lib/cache-navigation";

interface DonneesContributions {
    miennes: MaContribution[];
    file: ContributionAValider[];
}

// Écran 8 (+ écran 12, vide) du handoff mobile. Le formulaire de proposition,
// inline ici jusqu'au 25/08, a son propre écran désormais (/contributions/proposer).
export default function ContributionsPage() {
    const { user, role, isLoading } = useAuth();
    const autorise = role === "contributeur" || role === "admin";

    const cle = user && autorise ? cleCache("contributions", user.id) : null;
    const { donnees, premierChargement, rafraichir } = useListeMemorisee<DonneesContributions>({
        cle,
        charger: async () => {
            const [miennes, file] = await Promise.all([
                listerMesContributions(),
                listerContributionsAValider(),
            ]);
            return { miennes, file };
        },
    });

    const mesContributions = donnees?.miennes ?? [];
    const aValider = donnees?.file ?? [];
    const chargement = premierChargement || (cle !== null && donnees === null);

    useScrollMemorise(cle, donnees !== null);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutre-400" />
            </div>
        );
    }

    if (!autorise) {
        return <div className="p-8 text-center text-sm text-muted-foreground">Accès réservé aux contributeurs</div>;
    }

    // Ces deux gestes changent aussi les compteurs de Mon espace (propositions,
    // votes) : sans invalidation croisée, on y reverrait les chiffres d'avant.
    // rafraichir() suffit pour l'écran courant, il force le réseau.
    const supprimer = async (contribution: MaContribution) => {
        const res = await supprimerContributionAction(contribution.id);
        if (res.success) {
            toast.success(res.message);
            invaliderCache("dashboard");
            rafraichir();
        } else {
            toast.error(res.error);
        }
    };

    const basculerVote = async (contribution: ContributionAValider) => {
        const res = contribution.deja_vote
            ? await retirerVoteAction(contribution.id)
            : await voterAction(contribution.id);
        if (res.success) {
            toast.success(res.message);
            invaliderCache("dashboard");
            rafraichir();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <AppHeader
                variant="stack"
                titre="Mes contributions"
                backHref="/dashboard"
                trailing={
                    <Link
                        href="/contributions/proposer"
                        aria-label="Proposer un mot"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutre-100 text-foreground"
                    >
                        <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
                    </Link>
                }
            />

            <main className="flex-1 px-4 pt-[18px] pb-8">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-neutre-400">
                    Mes propositions
                </p>
                {chargement ? (
                    <ListSkeleton lignes={2} />
                ) : mesContributions.length === 0 ? (
                    <EtatVide texte="Aucune proposition pour l'instant." lien="/contributions/proposer" libelleLien="Proposer un mot →" />
                ) : (
                    <div className="mb-6 flex flex-col gap-2.5">
                        {mesContributions.map((c) => (
                            <div key={c.id} className="rounded-lg border border-border bg-card p-3.5">
                                <p className="text-base font-bold text-foreground">
                                    {c.francais} → {c.alsacien}
                                </p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {LIBELLES_TYPE_TERME[c.type as TypeTerme]}
                                    {c.contexte && ` · ${c.contexte}`}
                                </p>
                                <div className="mt-2.5 flex items-center justify-between">
                                    <span className="text-sm font-bold text-foreground">
                                        {c.score}/{SCORE_PLEIN} confirmations
                                    </span>
                                    {c.retenue ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutre-100 px-2.5 py-1 text-xs font-semibold text-neutre-600">
                                            <Lock className="h-[11px] w-[11px]" />
                                            Retenue dans une entrée
                                        </span>
                                    ) : (
                                        <div className="flex gap-1.5">
                                            <Link
                                                href={`/contributions/proposer?id=${c.id}`}
                                                aria-label={`Modifier « ${c.francais} » → « ${c.alsacien} »`}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutre-100 text-foreground"
                                            >
                                                <Pencil className="h-[15px] w-[15px]" />
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button
                                                        type="button"
                                                        aria-label={`Supprimer « ${c.francais} » → « ${c.alsacien} »`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-marque-rouge-50 text-marque-rouge-500"
                                                    >
                                                        <Trash2 className="h-[15px] w-[15px]" />
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-modal">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Supprimer « {c.francais} » ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Ta proposition « {c.alsacien} » quitte la file de validation
                                                            avec les confirmations reçues. Tu pourras la reproposer, mais
                                                            son score repart de zéro.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-marque-rouge-500 text-white hover:bg-marque-rouge-600"
                                                            onClick={() => supprimer(c)}
                                                        >
                                                            Supprimer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-neutre-400">À valider</p>
                {chargement ? (
                    <ListSkeleton lignes={2} />
                ) : aValider.length === 0 ? (
                    <EtatVide texte="Rien à valider pour l'instant." />
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {aValider.map((c) => (
                            <div key={c.id} className="rounded-lg border border-border bg-card p-3.5">
                                <p className="text-base font-bold text-foreground">
                                    {c.francais} → {c.alsacien}
                                </p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {c.auteur}
                                    {c.contexte && ` · ${c.contexte}`}
                                </p>
                                <div className="mt-2.5 flex items-center justify-between">
                                    <span className="text-sm font-bold text-foreground">
                                        {c.score}/{SCORE_PLEIN} confirmations
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => basculerVote(c)}
                                        className={
                                            c.deja_vote
                                                ? "flex h-8 items-center gap-1 rounded-lg bg-succes-500 px-3 text-[13px] font-semibold text-white"
                                                : "flex h-8 items-center gap-1 rounded-lg border border-bordure-forte px-3 text-[13px] font-semibold text-foreground"
                                        }
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        {c.deja_vote ? "Confirmé" : "Confirmer"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function EtatVide({ texte, lien, libelleLien }: { texte: string; lien?: string; libelleLien?: string }) {
    return (
        <div className="mb-6 rounded-lg border border-dashed border-neutre-300 px-4 py-[22px] text-center">
            <p className="text-[15px] font-semibold text-muted-foreground">{texte}</p>
            {lien && (
                <Link href={lien} className="mt-2 inline-block text-sm font-semibold text-marque-rouge-texte">
                    {libelleLien}
                </Link>
            )}
        </div>
    );
}

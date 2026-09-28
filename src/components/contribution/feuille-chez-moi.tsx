"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { monVillageAction } from "@/app/actions/membres";
import {
    chargerVoteAction,
    remplacerVillageVoteAction,
    retirerVoteAction,
    voterPourVarianteAction,
} from "@/app/actions/votes";
import {
    BOUTON_PRINCIPAL,
    BOUTON_SECONDAIRE,
    Cadre,
    CarteCandidat,
    EtapeVillage,
    FeuilleAdaptative,
    Francais,
    Ligne,
    type Village,
} from "@/components/contribution/habillage";
import type { EchecContribution, MonVote } from "@/lib/contribution";
import { formeDictionnaire, type VarianteDetaillee } from "@/lib/dictionnaire";
import { cn } from "@/lib/utils";

// « Chez moi aussi » par une feuille (28/09/2026, piste B choisie par John).
// Le bouton posait ou retirait le vote au premier toucher, sans dire quel
// village, et un toucher de trop écrivait un retrait au journal. Désormais :
//
//   pas de vote          → confirmer, avec le village nommé (et « Changer »)
//   vote, mon village    → confirmer le retrait
//   vote, ancien village → le rattacher au village actuel, ou le retirer
//                          (le membre a changé de village depuis son vote)
//
// Rien ne bouge sans un geste dans la feuille. Côté alsacien, la question
// change parce que le sens change : on n'affirme pas qu'une forme se dit, mais
// qu'elle veut dire ce mot-là chez soi.

export type CoteVote = "fr" | "als";

export function FeuilleChezMoi({
    varianteId,
    cote,
    ouvert,
    onOuvertChange,
    onSucces,
}: {
    varianteId: string;
    cote: CoteVote;
    ouvert: boolean;
    onOuvertChange: (ouvert: boolean) => void;
    /** Reçoit le vote tel qu'il est après le geste. Par défaut, la page
     *  serveur est rafraîchie. */
    onSucces?: (vote: MonVote | null) => void;
}) {
    return (
        <FeuilleAdaptative
            ouvert={ouvert}
            onOuvertChange={onOuvertChange}
            titre="Chez moi aussi"
            description="Rattacher ton village à cette forme, ou l'en retirer."
        >
            {ouvert && (
                <Parcours varianteId={varianteId} cote={cote} fermer={() => onOuvertChange(false)} onSucces={onSucces} />
            )}
        </FeuilleAdaptative>
    );
}

interface Donnees {
    lemme: { id: string; francais: string };
    variante: VarianteDetaillee;
}

function Parcours({
    varianteId,
    cote,
    fermer,
    onSucces,
}: {
    varianteId: string;
    cote: CoteVote;
    fermer: () => void;
    onSucces?: (vote: MonVote | null) => void;
}) {
    const router = useRouter();
    const [village, setVillage] = useState<Village | null | undefined>(undefined);
    const [donnees, setDonnees] = useState<Donnees | null | undefined>(undefined);
    const [etape, setEtape] = useState<"geste" | "village">("geste");
    /** Incrémenté après un changement de village : on relit tout. */
    const [lecture, setLecture] = useState(0);
    const [envoi, demarrer] = useTransition();

    // Relu à chaque ouverture et après un changement de village : c'est la
    // base qui dit si le vote porte encore le village actuel.
    useEffect(() => {
        let actif = true;
        setDonnees(undefined);
        Promise.all([monVillageAction(), chargerVoteAction(varianteId)]).then(([v, d]) => {
            if (!actif) return;
            setVillage(v);
            setDonnees(d);
            if (!v && d && !d.variante.monVote) setEtape("village");
        });
        return () => { actif = false; };
    }, [varianteId, lecture]);

    if (etape === "village" && village !== undefined) {
        return (
            <EtapeVillage
                actuel={village}
                onRetour={village ? () => setEtape("geste") : undefined}
                onChoisi={() => {
                    setEtape("geste");
                    setLecture((n) => n + 1);
                }}
            />
        );
    }

    if (donnees === undefined || village === undefined) {
        return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
    }
    if (donnees === null) {
        return (
            <Cadre titre="Cette forme n'est plus là" sousTitre="Elle a peut-être été retirée entre-temps.">
                <button type="button" onClick={fermer} className={BOUTON_SECONDAIRE}>Fermer</button>
            </Cadre>
        );
    }

    const { lemme, variante: v } = donnees;
    const forme = formeDictionnaire(v.forme);
    const vote = v.monVote ?? null;
    const formeEnGras = <span lang="gsw" className="font-semibold text-foreground">{forme}</span>;

    function agir(action: () => Promise<{ succes: true } | EchecContribution>, message: string, apres: MonVote | null) {
        demarrer(async () => {
            const res = await action();
            if (res.succes) {
                toast.success(message);
                fermer();
                if (onSucces) onSucces(apres);
                else router.refresh();
            } else if (res.villageRequis) {
                setEtape("village");
            } else {
                toast.error(res.erreur);
            }
        });
    }

    const sens = cote === "als"
        ? <>Au sens de «&nbsp;<Francais>{lemme.francais}</Francais>&nbsp;».</>
        : <>Pour dire «&nbsp;<Francais>{lemme.francais}</Francais>&nbsp;».</>;

    // Voté depuis un ancien village.
    if (vote && !vote.actuel) {
        return (
            <Cadre
                titre={`Tu l'as dite pour ${vote.village}`}
                sousTitre={village ? <>Ton village est maintenant {village.nom}. {sens}</> : sens}
            >
                <CarteCandidat v={v} />
                {village && (
                    <button
                        type="button"
                        disabled={envoi}
                        className={cn(BOUTON_PRINCIPAL, "mt-5")}
                        onClick={() => agir(
                            () => remplacerVillageVoteAction(v.id),
                            `« ${forme} » se dit maintenant à ${village.nom}`,
                            { village: village.nom, actuel: true },
                        )}
                    >
                        {envoi ? "Enregistrement…" : `La dire pour ${village.nom} à la place`}
                    </button>
                )}
                <button
                    type="button"
                    disabled={envoi}
                    className={cn(village ? BOUTON_SECONDAIRE : BOUTON_PRINCIPAL, village ? "mt-2.5" : "mt-5")}
                    onClick={() => agir(() => retirerVoteAction(v.id), `${vote.village} retiré de « ${forme} »`, null)}
                >
                    Retirer {vote.village}
                </button>
                <button
                    type="button"
                    onClick={fermer}
                    className="mt-1 h-11 w-full rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Garder {vote.village}
                </button>
            </Cadre>
        );
    }

    // Voté depuis mon village : le retrait se confirme.
    if (vote) {
        return (
            <Cadre
                titre="Retirer ton village ?"
                sousTitre={<>{formeEnGras} ne sera plus rattachée à {vote.village}. Tu pourras la remettre quand tu veux.</>}
            >
                <CarteCandidat v={v} />
                <button
                    type="button"
                    disabled={envoi}
                    className={cn(BOUTON_PRINCIPAL, "mt-5")}
                    onClick={() => agir(() => retirerVoteAction(v.id), `${vote.village} retiré de « ${forme} »`, null)}
                >
                    {envoi ? "Enregistrement…" : `Retirer ${vote.village}`}
                </button>
                <button type="button" onClick={fermer} className={cn(BOUTON_SECONDAIRE, "mt-2.5")}>
                    Garder
                </button>
            </Cadre>
        );
    }

    // Pas encore de vote : confirmer, avec le village nommé.
    return (
        <Cadre titre={cote === "als" ? "Ça veut dire ça chez toi ?" : "Ça se dit comme ça chez toi ?"} sousTitre={sens}>
            <CarteCandidat v={v} />
            <dl className="mt-3 rounded-lg border border-border">
                <Ligne terme="Ton village">
                    <span className="flex items-center justify-between gap-3">
                        <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
                            <MapPin className="h-4 w-4 shrink-0 text-sens-texte" strokeWidth={2.2} aria-hidden />
                            <span className="truncate">{village?.nom}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setEtape("village")}
                            className="shrink-0 text-sm font-semibold text-sens-texte underline-offset-4 hover:underline"
                        >
                            Changer
                        </button>
                    </span>
                </Ligne>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
                {village?.nom} s&apos;ajoute aux villages de cette forme, sur la fiche et sur la carte.
            </p>
            <button
                type="button"
                disabled={envoi || !village}
                className={cn(BOUTON_PRINCIPAL, "mt-5")}
                onClick={() => village && agir(
                    () => voterPourVarianteAction(v.id),
                    `${village.nom} ajouté à « ${forme} »`,
                    { village: village.nom, actuel: true },
                )}
            >
                {envoi ? "Enregistrement…" : "Oui, chez moi aussi"}
            </button>
            <button type="button" onClick={fermer} className={cn(BOUTON_SECONDAIRE, "mt-2.5")}>
                Annuler
            </button>
        </Cadre>
    );
}

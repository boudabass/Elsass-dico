"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { monVillageAction } from "@/app/actions/membres";
import { creerMotAction, verifierMotAction, type MotExistant, type TypeMotMembre } from "@/app/actions/mots";
import { chargerLemme, rechercherAction } from "@/app/actions/recherche";
import { creerVarianteAction } from "@/app/actions/variantes";
import { remplacerVillageVoteAction, voterPourVarianteAction } from "@/app/actions/votes";
import { BadgeConfiance } from "@/components/badge-confiance";
import {
    ChampForme,
    VALEUR_VIDE,
    formeDeValeur,
    saisieDeValeur,
    valeurDepuis,
    type ValeurForme,
} from "@/components/contribution/champ-forme";
import {
    BOUTON_PRINCIPAL,
    BOUTON_SECONDAIRE,
    CHAMP,
    Cadre,
    CarteCandidat,
    EtapeVillage,
    FeuilleAdaptative,
    Francais,
    LIGNE_CHOIX,
    Ligne,
    type Village,
} from "@/components/contribution/habillage";
import { useRequeteDebattue } from "@/hooks/use-requete-debattue";
import {
    formeDictionnaire,
    LIBELLES_TYPE_TERME,
    precisionLemme,
    type LemmeResume,
    type VarianteDetaillee,
} from "@/lib/dictionnaire";
import { classerSaisie, type Rapprochement } from "@/lib/saisie-forme";
import { cn } from "@/lib/utils";

// Le parcours « Ça se dit autrement chez moi ? » (28/09/2026), décidé avec John
// après la refonte des deux sens de lecture. Il remplace le champ unique de
// `nouvelle-variante.tsx`, qui ne savait ni l'article, ni l'existant, ni
// l'alsacien → français.
//
// Une feuille par étapes : un tiroir qui monte du bas sur téléphone, une
// fenêtre centrée à partir de la tablette. Les étapes :
//
//   village (s'il manque) → mot français (côté alsacien, ou création)
//     → ta forme → vérification → récapitulatif
//
// La vérification est TOUJOURS montrée (décision de John) : la forme tapée est
// comparée aux formes de CE mot seulement (src/lib/saisie-forme.ts), et la plus
// proche est proposée. Une forme identique ne peut pas être recréée, on y
// ajoute son village. Le serveur refait le contrôle : l'écran ne fait pas
// autorité.
//
// Les listes (villages, mots) sont posées sous leur champ, pas dans un
// popover : un popover Radix dans un tiroir vaul se bat avec le piège de focus
// et les clics, et une liste en place se lit mieux au pouce.

export type DepartContribution =
    /** Depuis un mot français : fiche, carte, jeu. */
    | { type: "mot"; lemme: { id: string; francais: string } }
    /** Depuis une forme alsacienne : « Ce mot veut aussi dire… ». */
    | { type: "forme"; forme: string }
    /** Depuis « aucun résultat » : le terme cherché, dans sa langue. */
    | { type: "nouveau"; francais?: string; forme?: string };

export interface ResultatContribution {
    lemmeId: string;
    /** Un mot vient d'être créé : l'appelant peut ouvrir sa fiche. */
    nouveauMot: boolean;
}

type Etape = "village" | "choix-mot" | "nouveau-mot" | "forme" | "verification" | "recap";

interface MotChoisi {
    id: string;
    francais: string;
}

interface MotNouveau {
    francais: string;
    type: TypeMotMembre;
}

const TYPES: { valeur: TypeMotMembre; libelle: string }[] = [
    { valeur: "mot", libelle: "Un mot" },
    { valeur: "expression", libelle: "Une expression" },
    { valeur: "proverbe", libelle: "Un proverbe" },
];

function premiereEtape(depart: DepartContribution): Etape {
    if (depart.type === "mot") return "forme";
    if (depart.type === "nouveau" && depart.francais) return "nouveau-mot";
    return "choix-mot";
}

export function FeuilleContribution({
    depart,
    ouvert,
    onOuvertChange,
    onSucces,
}: {
    depart: DepartContribution;
    ouvert: boolean;
    onOuvertChange: (ouvert: boolean) => void;
    onSucces?: (r: ResultatContribution) => void;
}) {
    const titre = depart.type === "forme" ? "Ce mot veut aussi dire…" : depart.type === "nouveau" ? "Ajouter au dictionnaire" : "Ça se dit autrement chez moi ?";
    return (
        <FeuilleAdaptative ouvert={ouvert} onOuvertChange={onOuvertChange} titre={titre} description="Ajouter ta façon de dire, avec ton village.">
            {ouvert && <Parcours depart={depart} fermer={() => onOuvertChange(false)} onSucces={onSucces} />}
        </FeuilleAdaptative>
    );
}

// --- Le parcours ----------------------------------------------------------------
//
// Monté à l'ouverture, démonté à la fermeture : chaque ouverture repart d'un
// état propre, sans rien à réinitialiser à la main.

function Parcours({
    depart,
    fermer,
    onSucces,
}: {
    depart: DepartContribution;
    fermer: () => void;
    onSucces?: (r: ResultatContribution) => void;
}) {
    const router = useRouter();
    const [village, setVillage] = useState<Village | null | undefined>(undefined);
    const [etape, setEtape] = useState<Etape>(premiereEtape(depart));
    /** L'étape où revenir après avoir choisi son village. */
    const [apresVillage, setApresVillage] = useState<Etape | null>(null);
    const [mot, setMot] = useState<MotChoisi | null>(depart.type === "mot" ? depart.lemme : null);
    const [motNouveau, setMotNouveau] = useState<MotNouveau | null>(null);
    const [formes, setFormes] = useState<VarianteDetaillee[] | null>(null);
    const [valeur, setValeur] = useState<ValeurForme>(() =>
        depart.type === "forme" ? valeurDepuis(depart.forme)
            : depart.type === "nouveau" && depart.forme ? valeurDepuis(depart.forme)
                : VALEUR_VIDE,
    );
    const [envoi, demarrer] = useTransition();

    // Le village d'abord : sans lui, rien ne se publie (un vote = un village).
    useEffect(() => {
        let actif = true;
        monVillageAction().then((v) => {
            if (!actif) return;
            setVillage(v);
            if (!v) {
                setApresVillage(premiereEtape(depart));
                setEtape("village");
            }
        });
        return () => { actif = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Les formes du mot, dès qu'il est connu : c'est à elles qu'on compare.
    useEffect(() => {
        if (!mot) return;
        let actif = true;
        setFormes(null);
        chargerLemme(mot.id).then((l) => { if (actif) setFormes(l?.variantes ?? []); });
        return () => { actif = false; };
    }, [mot]);

    const composee = useMemo(() => formeDeValeur(valeur), [valeur]);
    const rapprochement = useMemo(
        () => (composee && formes ? classerSaisie(composee, formes) : null),
        [composee, formes],
    );

    function allerVillage() {
        setApresVillage(etape);
        setEtape("village");
    }

    function reussir(message: string, r: ResultatContribution) {
        toast.success(message);
        fermer();
        if (onSucces) onSucces(r);
        // Depuis « aucun résultat », il n'y a pas de page à rafraîchir : on ouvre
        // la fiche du mot, créé ou retrouvé.
        else if (r.nouveauMot || depart.type === "nouveau") router.push(`/entree/${r.lemmeId}`);
        else router.refresh();
    }

    function voter(v: VarianteDetaillee) {
        if (!mot) return;
        if (v.monVote?.actuel) {
            reussir(`${village?.nom ?? "Ton village"} y est déjà`, { lemmeId: mot.id, nouveauMot: false });
            return;
        }
        // Dite depuis un ancien village : la choisir ici est le geste explicite
        // qui la rattache au village actuel (un seul témoignage par forme).
        demarrer(async () => {
            const res = v.monVote ? await remplacerVillageVoteAction(v.id) : await voterPourVarianteAction(v.id);
            if (res.succes) {
                reussir(`${village?.nom ?? "Ton village"} ajouté à « ${formeDictionnaire(v.forme)} »`, { lemmeId: mot.id, nouveauMot: false });
            } else if (res.villageRequis) {
                allerVillage();
            } else {
                toast.error(res.erreur);
            }
        });
    }

    function publier() {
        demarrer(async () => {
            const saisie = saisieDeValeur(valeur);
            if (motNouveau) {
                const res = await creerMotAction({ francais: motNouveau.francais, type: motNouveau.type, forme: saisie });
                if (res.succes) {
                    reussir(`« ${motNouveau.francais} » ajouté au dictionnaire`, { lemmeId: res.lemmeId, nouveauMot: true });
                } else if ("villageRequis" in res && res.villageRequis) {
                    allerVillage();
                } else if ("lemmeExistant" in res && res.lemmeExistant) {
                    // Créé entre-temps par quelqu'un d'autre : on bascule sur lui,
                    // et la vérification compare à ses formes.
                    toast.info(res.erreur);
                    setMot({ id: res.lemmeExistant, francais: motNouveau.francais });
                    setMotNouveau(null);
                    setEtape("verification");
                } else {
                    toast.error(res.erreur);
                }
                return;
            }
            if (!mot) return;
            const res = await creerVarianteAction(mot.id, saisie);
            if (res.succes) {
                reussir(`« ${formeDictionnaire(composee?.forme ?? "")} » ajoutée à ${village?.nom ?? "ton village"}`, { lemmeId: mot.id, nouveauMot: false });
            } else if (res.villageRequis) {
                allerVillage();
            } else {
                toast.error(res.erreur);
            }
        });
    }

    if (village === undefined) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

    switch (etape) {
        case "village":
            return (
                <EtapeVillage
                    actuel={village}
                    onRetour={village && apresVillage ? () => setEtape(apresVillage) : undefined}
                    onChoisi={(v) => {
                        setVillage(v);
                        setEtape(apresVillage ?? premiereEtape(depart));
                    }}
                />
            );
        case "choix-mot":
            return (
                <EtapeChoixMot
                    formeSaisie={formeDeValeur(valeur)?.forme ?? null}
                    onChoisi={(m) => { setMot(m); setMotNouveau(null); setEtape("forme"); }}
                    onCreer={(francais) => { setMotNouveau({ francais, type: typeDevine(francais) }); setEtape("nouveau-mot"); }}
                />
            );
        case "nouveau-mot":
            return (
                <EtapeNouveauMot
                    initial={motNouveau ?? { francais: depart.type === "nouveau" ? depart.francais ?? "" : "", type: typeDevine(depart.type === "nouveau" ? depart.francais ?? "" : "") }}
                    onRetour={depart.type === "nouveau" && depart.francais ? undefined : () => setEtape("choix-mot")}
                    onExistant={(m) => { setMot(m); setMotNouveau(null); setEtape("forme"); }}
                    onValide={(m) => { setMotNouveau(m); setMot(null); setFormes([]); setEtape("forme"); }}
                />
            );
        case "forme":
            return (
                <Cadre
                    titre="Comment tu le dis ?"
                    sousTitre={<>Pour «&nbsp;<Francais>{motNouveau?.francais ?? mot?.francais}</Francais>&nbsp;», à {village?.nom}.</>}
                    onRetour={depart.type === "mot" ? undefined : () => setEtape(motNouveau ? "nouveau-mot" : "choix-mot")}
                >
                    <ChampForme valeur={valeur} onChange={setValeur} autoFocus />
                    <button
                        type="button"
                        className={cn(BOUTON_PRINCIPAL, "mt-6")}
                        disabled={!composee || formes === null}
                        onClick={() => setEtape("verification")}
                    >
                        {formes === null && composee ? "Chargement des formes…" : "Vérifier"}
                    </button>
                </Cadre>
            );
        case "verification":
            return (
                <EtapeVerification
                    francais={motNouveau?.francais ?? mot?.francais ?? ""}
                    nouveauMot={!!motNouveau}
                    forme={composee?.forme ?? ""}
                    rapprochement={rapprochement}
                    formes={formes}
                    envoi={envoi}
                    onRetour={() => setEtape("forme")}
                    onVoter={voter}
                    onContinuer={() => setEtape("recap")}
                />
            );
        case "recap":
            return (
                <Cadre titre="On publie ?" onRetour={() => setEtape("verification")}>
                    <dl className="divide-y divide-border rounded-lg border border-border">
                        <Ligne terme="Ta forme">
                            <span lang="gsw" className="text-xl font-bold text-foreground">{formeDictionnaire(composee?.forme ?? "")}</span>
                        </Ligne>
                        <Ligne terme="Pour">
                            <Francais>{motNouveau?.francais ?? mot?.francais}</Francais>
                            {motNouveau && (
                                <span className="block text-sm text-muted-foreground">
                                    Nouveau dans le dictionnaire · {LIBELLES_TYPE_TERME[motNouveau.type]}
                                </span>
                            )}
                        </Ligne>
                        <Ligne terme="Village">
                            <span className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                                    <MapPin className="h-4 w-4 text-sens-texte" strokeWidth={2.2} aria-hidden />
                                    {village?.nom}
                                </span>
                                <button type="button" onClick={allerVillage} className="text-sm font-semibold text-sens-texte underline-offset-4 hover:underline">
                                    Changer
                                </button>
                            </span>
                        </Ligne>
                    </dl>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Tout le monde la verra. Tu pourras la modifier tant que personne d&apos;autre ne l&apos;a ajoutée chez lui.
                    </p>
                    <button type="button" className={cn(BOUTON_PRINCIPAL, "mt-5")} disabled={envoi || !composee} onClick={publier}>
                        {envoi ? "Publication…" : "Publier"}
                    </button>
                </Cadre>
            );
    }
}

function typeDevine(francais: string): TypeMotMembre {
    return francais.trim().includes(" ") ? "expression" : "mot";
}

// --- Le mot français (côté alsacien) -----------------------------------------------

function EtapeChoixMot({
    formeSaisie,
    onChoisi,
    onCreer,
}: {
    formeSaisie: string | null;
    onChoisi: (m: MotChoisi) => void;
    onCreer: (francais: string) => void;
}) {
    const [saisie, setSaisie] = useState("");
    const requete = useRequeteDebattue(saisie);
    const [resultats, setResultats] = useState<LemmeResume[] | null>(null);
    const derniere = useRef("");

    useEffect(() => {
        derniere.current = requete;
        if (!requete) { setResultats(null); return; }
        setResultats(null);
        rechercherAction(requete).then((r) => { if (derniere.current === requete) setResultats(r); });
    }, [requete]);

    const terme = saisie.trim();

    return (
        <Cadre
            titre="Quel mot français ?"
            sousTitre={formeSaisie
                ? <>Ce que veut dire <span lang="gsw" className="font-semibold text-foreground">{formeDictionnaire(formeSaisie)}</span> chez toi.</>
                : "Le mot français que ta forme traduit."}
        >
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    aria-label="Chercher le mot français"
                    placeholder="salaire, bonjour…"
                    autoFocus
                    autoComplete="off"
                    className={cn(CHAMP, "pl-10")}
                />
            </div>
            <ul className="mt-2 flex flex-col" aria-live="polite">
                {requete && resultats === null && <li className="px-3 py-2.5 text-sm text-muted-foreground">Recherche…</li>}
                {resultats?.map((l) => (
                    <li key={l.id}>
                        <button type="button" onClick={() => onChoisi({ id: l.id, francais: l.francais })} className={LIGNE_CHOIX}>
                            <span className="min-w-0">
                                <span className="block truncate font-semibold text-foreground">{l.francais}</span>
                                {precisionLemme(l) && <span className="block truncate text-sm text-muted-foreground">{precisionLemme(l)}</span>}
                            </span>
                            <span className="shrink-0 text-sm text-muted-foreground">
                                {l.nbFormes} forme{l.nbFormes > 1 ? "s" : ""}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
            {terme.length >= 2 && resultats !== null && (
                <div className="mt-4 border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">
                        {resultats.length ? "Il n'est pas dans la liste ?" : `« ${terme} » n'est pas encore dans le dictionnaire.`}
                    </p>
                    <button type="button" onClick={() => onCreer(terme)} className={cn(BOUTON_SECONDAIRE, "mt-2")}>
                        Ajouter «&nbsp;{terme}&nbsp;»
                    </button>
                </div>
            )}
        </Cadre>
    );
}

// --- Un nouveau mot français -----------------------------------------------------

function EtapeNouveauMot({
    initial,
    onRetour,
    onExistant,
    onValide,
}: {
    initial: MotNouveau;
    onRetour?: () => void;
    onExistant: (m: MotChoisi) => void;
    onValide: (m: MotNouveau) => void;
}) {
    const [francais, setFrancais] = useState(initial.francais);
    const [type, setType] = useState<TypeMotMembre>(initial.type);
    const [existants, setExistants] = useState<MotExistant[] | null>(null);
    const [envoi, demarrer] = useTransition();

    // Le libellé change : l'ancienne vérification ne vaut plus.
    useEffect(() => { setExistants(null); }, [francais]);

    const libelle = francais.trim().replace(/\s+/g, " ");
    const memeType = existants?.find((m) => m.type === type && !m.contexte);

    function verifier() {
        if (!libelle) return;
        demarrer(async () => {
            const r = await verifierMotAction(libelle);
            if (r.length) setExistants(r);
            else onValide({ francais: libelle, type });
        });
    }

    return (
        <Cadre
            titre="Le mot français"
            sousTitre="Il entre dans le dictionnaire avec ta forme alsacienne, jamais sans elle."
            onRetour={onRetour}
        >
            <label className="text-sm font-semibold text-foreground" htmlFor="contribution-francais">En français</label>
            <input
                id="contribution-francais"
                value={francais}
                onChange={(e) => setFrancais(e.target.value)}
                maxLength={120}
                autoFocus
                autoComplete="off"
                className={cn(CHAMP, "mt-1.5 text-lg font-semibold")}
            />

            <p className="mt-5 text-sm font-semibold text-foreground" id="contribution-type">C&apos;est…</p>
            <div role="radiogroup" aria-labelledby="contribution-type" className="mt-1.5 grid grid-cols-3 gap-1.5">
                {TYPES.map((t) => (
                    <button
                        key={t.valeur}
                        type="button"
                        role="radio"
                        aria-checked={type === t.valeur}
                        onClick={() => { setType(t.valeur); setExistants(null); }}
                        className={cn(
                            "h-11 rounded-md border px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            type === t.valeur
                                ? "border-sens-500 bg-sens-500 text-white"
                                : "border-bordure-defaut text-foreground hover:border-sens-500",
                        )}
                    >
                        {t.libelle}
                    </button>
                ))}
            </div>

            {existants && (
                <div className="mt-5 rounded-lg border border-border p-3.5" aria-live="polite">
                    <p className="font-semibold text-foreground">
                        {memeType ? "Ce mot existe déjà." : "Un mot s'écrit déjà comme ça."}
                    </p>
                    <ul className="mt-2 flex flex-col gap-1">
                        {existants.map((m) => (
                            <li key={m.id}>
                                <button type="button" onClick={() => onExistant({ id: m.id, francais: m.francais })} className={cn(LIGNE_CHOIX, "border border-border")}>
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold text-foreground">{m.francais}</span>
                                        <span className="block truncate text-sm text-muted-foreground">
                                            {m.contexte || LIBELLES_TYPE_TERME[m.type]} · {m.nbFormes} forme{m.nbFormes > 1 ? "s" : ""}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-sm font-semibold text-sens-texte">Ajouter ma forme ici</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {!memeType && (
                        <button type="button" onClick={() => onValide({ francais: libelle, type })} className={cn(BOUTON_SECONDAIRE, "mt-3")}>
                            Non, c&apos;est un autre mot
                        </button>
                    )}
                </div>
            )}

            {!existants && (
                <button type="button" className={cn(BOUTON_PRINCIPAL, "mt-6")} disabled={!libelle || envoi} onClick={verifier}>
                    {envoi ? "Vérification…" : "Continuer"}
                </button>
            )}
        </Cadre>
    );
}

// --- Vérification ----------------------------------------------------------------

function EtapeVerification({
    francais,
    nouveauMot,
    forme,
    rapprochement,
    formes,
    envoi,
    onRetour,
    onVoter,
    onContinuer,
}: {
    francais: string;
    nouveauMot: boolean;
    forme: string;
    rapprochement: Rapprochement<VarianteDetaillee> | null;
    formes: VarianteDetaillee[] | null;
    envoi: boolean;
    onRetour: () => void;
    onVoter: (v: VarianteDetaillee) => void;
    onContinuer: () => void;
}) {
    const [toutes, setToutes] = useState(false);
    const tapee = <span lang="gsw" className="font-semibold text-foreground">{formeDictionnaire(forme)}</span>;

    const boutonVote = (v: VarianteDetaillee, libelle = "Oui, chez moi aussi") => (
        <button type="button" disabled={envoi} onClick={() => onVoter(v)} className={v.monVote?.actuel ? BOUTON_SECONDAIRE : BOUTON_PRINCIPAL}>
            {v.monVote?.actuel ? <><Check className="h-5 w-5 text-succes-500" strokeWidth={2.6} aria-hidden /> Ton village y est déjà</> : libelle}
        </button>
    );

    if (nouveauMot || !rapprochement || rapprochement.statut === "nouvelle") {
        const n = formes?.length ?? 0;
        return (
            <Cadre
                titre={nouveauMot ? "C'est un nouveau mot" : "Personne ne l'a encore écrite"}
                sousTitre={nouveauMot
                    ? <>«&nbsp;{francais}&nbsp;» n&apos;est pas encore dans le dictionnaire. {tapee} sera sa première forme.</>
                    : n === 0
                        ? <>{tapee} sera la première forme de «&nbsp;{francais}&nbsp;».</>
                        : n === 1
                            ? <>{tapee} ne ressemble pas à la seule forme déjà connue pour «&nbsp;{francais}&nbsp;».</>
                            : <>{tapee} ne ressemble à aucune des {n} formes déjà connues pour «&nbsp;{francais}&nbsp;».</>}
                onRetour={onRetour}
            >
                {!nouveauMot && n > 0 && (
                    <div className="rounded-lg border border-border">
                        <button
                            type="button"
                            aria-expanded={toutes}
                            onClick={() => setToutes(!toutes)}
                            className="flex w-full items-center justify-between px-3.5 py-3 text-sm font-semibold text-foreground"
                        >
                            Voir les formes connues
                            <span className="text-muted-foreground">{toutes ? "Masquer" : n}</span>
                        </button>
                        {toutes && (
                            <ul className="flex flex-col gap-1 border-t border-border px-3.5 py-2.5">
                                {formes!.map((v) => (
                                    <li key={v.id} className="flex items-center justify-between gap-3 py-1">
                                        <span lang="gsw" className="font-semibold text-foreground">{formeDictionnaire(v.forme)}</span>
                                        <BadgeConfiance nbSources={v.nbSources} nbVillages={v.nbVillages} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
                <button type="button" className={cn(BOUTON_PRINCIPAL, "mt-5")} onClick={onContinuer}>
                    Continuer
                </button>
            </Cadre>
        );
    }

    const { statut, candidat, autres } = rapprochement;
    if (statut === "identique" && candidat) {
        return (
            <Cadre titre="Elle existe déjà" sousTitre={<>{tapee} est déjà connue pour «&nbsp;{francais}&nbsp;». Ajoute simplement ton village.</>} onRetour={onRetour}>
                <CarteCandidat v={candidat} action={boutonVote(candidat, "Chez moi aussi")} />
                <button type="button" onClick={onRetour} className={cn(BOUTON_SECONDAIRE, "mt-3")}>
                    Modifier ma forme
                </button>
            </Cadre>
        );
    }

    return (
        <Cadre titre="Tu penses à celle-ci ?" sousTitre={<>Une forme proche de {tapee} existe déjà pour «&nbsp;{francais}&nbsp;».</>} onRetour={onRetour}>
            <CarteCandidat v={candidat!} action={boutonVote(candidat!)} />
            {autres.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                    {autres.map((v) => (
                        <li key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5">
                            <span lang="gsw" className="font-semibold text-foreground">{formeDictionnaire(v.forme)}</span>
                            <button
                                type="button"
                                disabled={envoi}
                                onClick={() => onVoter(v)}
                                className="h-9 shrink-0 rounded-full border border-bordure-forte px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                            >
                                {v.monVote?.actuel ? "Déjà chez toi" : "C'est celle-là"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button type="button" onClick={onContinuer} className={cn(BOUTON_SECONDAIRE, "mt-4")}>
                Non, la mienne est différente
            </button>
        </Cadre>
    );
}

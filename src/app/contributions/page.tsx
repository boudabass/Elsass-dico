"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Check, Lock, X } from "lucide-react";
import {
    listerMesContributions,
    listerContributionsAValider,
    ajouterContributionAction,
    modifierContributionAction,
    supprimerContributionAction,
    voterAction,
    retirerVoteAction,
    type MaContribution,
    type ContributionAValider,
} from "@/app/actions/contributions";
import {
    TYPES_TERME,
    LIBELLES_TYPE_TERME,
    REGIONS,
    LIBELLES_REGION,
    SCORE_PLEIN,
    type TypeTerme,
} from "@/lib/dictionnaire";

const CHAMPS_VIDES = {
    francais: "",
    alsacien: "",
    contexte: "",
    type: "mot" as TypeTerme,
    region: "",
};

export default function ContributionsPage() {
    const { role, isLoading } = useAuth();
    const [mesContributions, setMesContributions] = useState<MaContribution[]>([]);
    const [aValider, setAValider] = useState<ContributionAValider[]>([]);
    const [chargement, setChargement] = useState(true);
    const [champs, setChamps] = useState(CHAMPS_VIDES);
    const [editionId, setEditionId] = useState<string | null>(null);
    const [enCours, setEnCours] = useState(false);

    const rafraichir = useCallback(async () => {
        setChargement(true);
        const [miennes, file] = await Promise.all([
            listerMesContributions(),
            listerContributionsAValider(),
        ]);
        setMesContributions(miennes);
        setAValider(file);
        setChargement(false);
    }, []);

    const autorise = role === "contributeur" || role === "admin";

    useEffect(() => {
        if (autorise) rafraichir();
    }, [autorise, rafraichir]);

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!autorise) {
        return <div className="p-8 text-center">Accès réservé aux contributeurs</div>;
    }

    const reinitialiser = () => {
        setChamps(CHAMPS_VIDES);
        setEditionId(null);
    };

    const soumettre = async (evenement: React.FormEvent) => {
        evenement.preventDefault();
        setEnCours(true);

        const donnees = new FormData();
        donnees.set("francais", champs.francais);
        donnees.set("alsacien", champs.alsacien);
        donnees.set("contexte", champs.contexte);
        donnees.set("type", champs.type);
        donnees.set("region", champs.region);

        const res = editionId
            ? await modifierContributionAction(editionId, donnees)
            : await ajouterContributionAction(donnees);

        setEnCours(false);

        if (res.success) {
            toast.success(res.message);
            reinitialiser();
            rafraichir();
        } else {
            toast.error(res.error);
        }
    };

    const editer = (contribution: MaContribution) => {
        setEditionId(contribution.id);
        setChamps({
            francais: contribution.francais,
            alsacien: contribution.alsacien,
            contexte: contribution.contexte,
            type: contribution.type as TypeTerme,
            region: contribution.region ?? "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const supprimer = async (contribution: MaContribution) => {
        if (!confirm(`Supprimer « ${contribution.francais} » ?`)) return;
        const res = await supprimerContributionAction(contribution.id);
        if (res.success) {
            toast.success(res.message);
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
            rafraichir();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Mes contributions</h1>
                <p className="text-muted-foreground mt-1">
                    Vos propositions entrent comme attestations, au même titre qu&apos;un ouvrage ou
                    un site. Elles ne sont publiées qu&apos;après arbitrage.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {editionId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {editionId ? "Modifier la contribution" : "Proposer une traduction"}
                    </CardTitle>
                    <CardDescription>
                        Écrivez l&apos;alsacien comme vous le prononcez : la mise en graphie ORTHAL
                        se fera à l&apos;arbitrage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={soumettre} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="francais">Français</Label>
                                <Input
                                    id="francais"
                                    value={champs.francais}
                                    onChange={(e) => setChamps({ ...champs, francais: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alsacien">Alsacien</Label>
                                <Input
                                    id="alsacien"
                                    value={champs.alsacien}
                                    onChange={(e) => setChamps({ ...champs, alsacien: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={champs.type}
                                    onValueChange={(valeur) => setChamps({ ...champs, type: valeur as TypeTerme })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TYPES_TERME.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {LIBELLES_TYPE_TERME[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Secteur</Label>
                                <Select
                                    value={champs.region === "" ? "non_precise" : champs.region}
                                    onValueChange={(valeur) =>
                                        setChamps({ ...champs, region: valeur === "non_precise" ? "" : valeur })
                                    }
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="non_precise">Non précisé</SelectItem>
                                        {REGIONS.map((region) => (
                                            <SelectItem key={region} value={region}>
                                                {LIBELLES_REGION[region]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contexte">Contexte</Label>
                                <Input
                                    id="contexte"
                                    placeholder="ex : le fruit"
                                    value={champs.contexte}
                                    onChange={(e) => setChamps({ ...champs, contexte: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={enCours}>
                                {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editionId ? "Enregistrer" : "Proposer"}
                            </Button>
                            {editionId && (
                                <Button type="button" variant="ghost" onClick={reinitialiser}>
                                    <X className="mr-2 h-4 w-4" /> Annuler
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mes propositions</CardTitle>
                    <CardDescription>
                        Le score indique combien d&apos;autres contributeurs ont confirmé la
                        proposition. Il aide à l&apos;arbitrage, il ne publie rien.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {chargement ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
                    ) : mesContributions.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            Aucune proposition pour l&apos;instant.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {mesContributions.map((contribution) => (
                                <li key={contribution.id} className="flex items-center gap-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {contribution.francais} → {contribution.alsacien}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {LIBELLES_TYPE_TERME[contribution.type as TypeTerme]}
                                            {contribution.contexte && ` · ${contribution.contexte}`}
                                            {contribution.retenue && " · retenue dans une entrée"}
                                        </p>
                                    </div>
                                    <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                                        {contribution.score}/{SCORE_PLEIN}
                                    </span>
                                    {contribution.retenue ? (
                                        <span
                                            className="text-muted-foreground shrink-0"
                                            title="Figée : elle justifie une entrée publiée"
                                        >
                                            <Lock className="w-4 h-4" />
                                        </span>
                                    ) : (
                                        <div className="flex gap-2 shrink-0">
                                            <Button variant="outline" size="sm" onClick={() => editer(contribution)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => supprimer(contribution)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Propositions des autres contributeurs</CardTitle>
                    <CardDescription>
                        Confirmez ce que vous savez juste. Vous ne pouvez pas voter pour vos propres
                        propositions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {chargement ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
                    ) : aValider.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            Rien à valider pour l&apos;instant.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {aValider.map((contribution) => (
                                <li key={contribution.id} className="flex items-center gap-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {contribution.francais} → {contribution.alsacien}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {contribution.auteur}
                                            {contribution.contexte && ` · ${contribution.contexte}`}
                                        </p>
                                    </div>
                                    <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                                        {contribution.score}/{SCORE_PLEIN}
                                    </span>
                                    <Button
                                        variant={contribution.deja_vote ? "secondary" : "outline"}
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() => basculerVote(contribution)}
                                    >
                                        <Check className="w-4 h-4 mr-1" />
                                        {contribution.deja_vote ? "Confirmé" : "Confirmer"}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

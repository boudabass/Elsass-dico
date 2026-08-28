"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/components/auth-provider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    listerMesContributions,
    ajouterContributionAction,
    modifierContributionAction,
} from "@/app/actions/contributions";
import {
    TYPES_TERME,
    LIBELLES_TYPE_TERME,
    REGIONS,
    LIBELLES_REGION,
    type TypeTerme,
} from "@/lib/dictionnaire";

// Écran 7 du handoff mobile : formulaire autonome (le formulaire inline de
// l'ancienne page /contributions du 25/08 en devient l'écran dédié).
// Deux modes, mêmes champs — pilotés par la query string plutôt que par
// useSearchParams(), qui imposerait une frontière Suspense au prérendu
// (même convention que login/page.tsx) :
//   ?id=<attestation>  → édition, préremplie depuis listerMesContributions()
//   ?francais=<terme>  → création préremplie (lien "Proposer ce mot" depuis
//                         un résultat de recherche vide, écran 10)
const CHAMPS_VIDES = {
    francais: "",
    alsacien: "",
    contexte: "",
    type: "mot" as TypeTerme,
    region: "",
};

export default function ProposerMotPage() {
    const router = useRouter();
    const { role, isLoading } = useAuth();
    const [champs, setChamps] = useState(CHAMPS_VIDES);
    const [editionId, setEditionId] = useState<string | null>(null);
    const [pret, setPret] = useState(false);
    const [enCours, setEnCours] = useState(false);

    const autorise = role === "contributeur" || role === "admin";

    useEffect(() => {
        if (!autorise) return;
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        const francaisPrerempli = params.get("francais");

        if (id) {
            listerMesContributions().then((liste) => {
                const trouvee = liste.find((c) => c.id === id);
                if (trouvee) {
                    setEditionId(trouvee.id);
                    setChamps({
                        francais: trouvee.francais,
                        alsacien: trouvee.alsacien,
                        contexte: trouvee.contexte,
                        type: trouvee.type as TypeTerme,
                        region: trouvee.region ?? "",
                    });
                }
                setPret(true);
            });
        } else {
            if (francaisPrerempli) {
                setChamps((c) => ({ ...c, francais: francaisPrerempli }));
            }
            setPret(true);
        }
    }, [autorise]);

    if (isLoading || (autorise && !pret)) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutre-400" />
            </div>
        );
    }

    if (!autorise) {
        return <div className="p-8 text-center text-sm text-muted-foreground">Accès réservé aux contributeurs</div>;
    }

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
            router.push("/contributions");
        } else {
            toast.error(res.error);
        }
    };

    const champLabel = "mb-1.5 block text-[13px] font-semibold text-foreground";
    const champInput =
        "h-[46px] w-full rounded-sm border border-neutre-300 px-3 text-base text-foreground outline-none placeholder:text-neutre-400 focus-visible:ring-2 focus-visible:ring-ring";

    return (
        <div className="flex min-h-screen flex-col">
            <AppHeader
                variant="stack"
                titre={editionId ? "Modifier la contribution" : "Proposer un mot"}
                backHref="/contributions"
            />

            <main className="flex-1 px-4 pt-5 pb-8">
                <p className="mb-[22px] text-sm leading-[1.5] text-muted-foreground">
                    Écris l&apos;alsacien comme tu le prononces : la mise en graphie ORTHAL se fait à
                    l&apos;arbitrage.
                </p>

                <form onSubmit={soumettre} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="francais" className={champLabel}>
                            Français <span className="text-marque-rouge-500">*</span>
                        </label>
                        <input
                            id="francais"
                            value={champs.francais}
                            onChange={(e) => setChamps({ ...champs, francais: e.target.value })}
                            placeholder="ex : bagou"
                            required
                            className={champInput}
                        />
                    </div>

                    <div>
                        <label htmlFor="alsacien" className={champLabel}>
                            Alsacien <span className="text-marque-rouge-500">*</span>
                        </label>
                        <input
                            id="alsacien"
                            value={champs.alsacien}
                            onChange={(e) => setChamps({ ...champs, alsacien: e.target.value })}
                            placeholder="ex : d' Zungafärtikait"
                            required
                            className={champInput}
                        />
                    </div>

                    <div>
                        <label htmlFor="contribution-type" className={champLabel}>Type</label>
                        <Select
                            value={champs.type}
                            onValueChange={(valeur) => setChamps({ ...champs, type: valeur as TypeTerme })}
                        >
                            <SelectTrigger id="contribution-type" className="h-[46px] rounded-sm border-neutre-300 px-3 text-base">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPES_TERME.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {LIBELLES_TYPE_TERME[type]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label htmlFor="contribution-secteur" className={champLabel}>
                            Secteur <span className="font-normal text-neutre-400">(optionnel)</span>
                        </label>
                        <Select
                            value={champs.region === "" ? "non_precise" : champs.region}
                            onValueChange={(valeur) =>
                                setChamps({ ...champs, region: valeur === "non_precise" ? "" : valeur })
                            }
                        >
                            <SelectTrigger id="contribution-secteur" className="h-[46px] rounded-sm border-neutre-300 px-3 text-base">
                                <SelectValue />
                            </SelectTrigger>
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

                    <div>
                        <label htmlFor="contexte" className={champLabel}>
                            Contexte <span className="font-normal text-neutre-400">(optionnel)</span>
                        </label>
                        <input
                            id="contexte"
                            value={champs.contexte}
                            onChange={(e) => setChamps({ ...champs, contexte: e.target.value })}
                            placeholder="ex : le fruit"
                            className={champInput}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={enCours}
                        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-marque-rouge-500 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-50"
                    >
                        {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                        {editionId ? "Enregistrer" : "Proposer"}
                    </button>
                    {editionId && (
                        <button
                            type="button"
                            onClick={() => router.push("/contributions")}
                            className="text-center text-sm font-semibold text-muted-foreground"
                        >
                            Annuler
                        </button>
                    )}
                </form>
            </main>
        </div>
    );
}

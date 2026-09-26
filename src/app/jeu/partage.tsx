"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Le partage du défi du jour (26/09/2026) : un aperçu de l'image de résultat
// (question, score en cases, « À toi de jouer »), puis de quoi l'envoyer.
// Depuis un site, Facebook et Instagram ne prennent ni texte pré-rempli ni
// image par lien : l'image passe par le panneau de partage du téléphone, ou se
// télécharge sur ordinateur. Rien n'y nomme un village (brief du 25/09/2026).

export function BoutonPartager({ numero, resultats }: { numero: number; resultats: boolean[] }) {
    const [ouvert, setOuvert] = useState(false);
    const bits = resultats.map((r) => (r ? "1" : "0")).join("");
    const src = `/api/partage/defi?n=${numero}&r=${bits}`;
    const score = resultats.filter(Boolean).length;

    return (
        <Dialog open={ouvert} onOpenChange={setOuvert}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-marque-rouge-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600"
                >
                    <Share2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    Partager mon résultat
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto">
                <DialogTitle>Partage ton résultat</DialogTitle>
                <DialogDescription>
                    Ton score et la première question, sans les réponses. De quoi donner envie de jouer.
                </DialogDescription>
                {ouvert && <Contenu numero={numero} score={score} total={resultats.length} src={src} />}
            </DialogContent>
        </Dialog>
    );
}

function Contenu({ numero, score, total, src }: { numero: number; score: number; total: number; src: string }) {
    const [fichier, setFichier] = useState<File | null>(null);
    const [lienImage, setLienImage] = useState<string | null>(null);
    const [echec, setEchec] = useState(false);

    // L'image est chargée dès l'ouverture : le partage du téléphone exige
    // d'être lancé juste après le clic, sans attendre le réseau entre les deux.
    useEffect(() => {
        let annule = false;
        let url: string | null = null;
        fetch(src)
            .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
            .then((blob) => {
                if (annule) return;
                url = URL.createObjectURL(blob);
                setLienImage(url);
                setFichier(new File([blob], `defi-du-jour-${numero}.png`, { type: "image/png" }));
            })
            .catch(() => !annule && setEchec(true));
        return () => {
            annule = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [src, numero]);

    const lienJeu = `${window.location.origin}/jeu`;
    const texte = `Le défi du jour n° ${numero} · ${score}/${total}. À toi de jouer : ${lienJeu}`;
    const partageFichier = !!fichier && typeof navigator.canShare === "function" && navigator.canShare({ files: [fichier] });

    function partager() {
        if (!fichier) return;
        navigator.share({ files: [fichier], text: texte }).catch((e: unknown) => {
            if ((e as Error)?.name !== "AbortError") toast.error("Le partage a échoué. Télécharge l'image à la place.");
        });
    }

    function copier() {
        navigator.clipboard.writeText(texte).then(
            () => toast.success("Texte copié, avec le lien du jeu"),
            () => toast.error("La copie a échoué. Réessaie."),
        );
    }

    return (
        <div className="mt-1 space-y-4">
            <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-neutre-50">
                {lienImage ? (
                    <img
                        src={lienImage}
                        alt={`Le défi du jour n° ${numero} : ${score} village${score > 1 ? "s" : ""} sur ${total}, et la première question.`}
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {echec ? "L'image n'a pas pu être préparée. Le texte reste copiable." : "Préparation de l'image…"}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {partageFichier && (
                    <button
                        type="button"
                        onClick={partager}
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-marque-rouge-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600"
                    >
                        <Share2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                        Partager
                    </button>
                )}
                {lienImage && (
                    <a
                        href={lienImage}
                        download={`defi-du-jour-${numero}.png`}
                        className={
                            partageFichier
                                ? "inline-flex h-11 items-center gap-2 rounded-lg border border-bordure-forte px-4 text-[15px] font-semibold text-foreground transition-colors hover:bg-neutre-50"
                                : "inline-flex h-11 items-center gap-2 rounded-lg bg-marque-rouge-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600"
                        }
                    >
                        <Download className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                        Télécharger l&apos;image
                    </a>
                )}
                <button
                    type="button"
                    onClick={copier}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-bordure-forte px-4 text-[15px] font-semibold text-foreground transition-colors hover:bg-neutre-50"
                >
                    <Copy className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    Copier le texte
                </button>
            </div>
        </div>
    );
}

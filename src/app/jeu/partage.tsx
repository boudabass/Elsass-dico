"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

// Le partage du défi du jour, un seul bouton (revu le 27/09/2026 avec John).
// Le panneau d'aperçu du 26/09 imitait l'écran du jeu en réduction, sans
// cadre : on croyait la page rechargée et plantée. Désormais :
// - sur téléphone, le bouton ouvre directement le menu de partage, avec
//   l'image de résultat en fichier et le lien du jeu ;
// - ailleurs, il télécharge l'image et copie le texte, un toast le dit.
// L'image est préparée dès l'affichage : le téléphone refuse d'ouvrir son
// menu si le toucher attend le réseau. Elle n'est stockée nulle part, ni ici
// ni sur le serveur (cf. /api/partage/defi).

export function BoutonPartager({ numero, resultats }: { numero: number; resultats: boolean[] }) {
    const bits = resultats.map((r) => (r ? "1" : "0")).join("");
    const src = `/api/partage/defi?n=${numero}&r=${bits}`;
    const score = resultats.filter(Boolean).length;
    const nomFichier = `defi-du-jour-${numero}.png`;
    const fichier = useRef<File | null>(null);
    const [pret, setPret] = useState(false);

    useEffect(() => {
        let annule = false;
        fetch(src)
            .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
            .then((blob) => {
                if (annule) return;
                fichier.current = new File([blob], nomFichier, { type: "image/png" });
                setPret(true);
            })
            // Sans image, le bouton partage encore le texte et le lien.
            .catch(() => undefined);
        return () => {
            annule = true;
        };
    }, [src, nomFichier]);

    function partager() {
        const lien = `${window.location.origin}/jeu`;
        // Une idée par ligne : collé d'un bloc dans une publication, il était illisible.
        const texte = [
            `The Elsassisch · Le défi du jour n° ${numero}`,
            `${score}/${resultats.length} village${score > 1 ? "s" : ""} trouvé${score > 1 ? "s" : ""}`,
            resultats.map((r) => (r ? "🟩" : "⬜")).join(""),
            "",
            `À toi de jouer : ${lien}`,
        ].join("\n");
        const f = fichier.current;
        const peutPartager = typeof navigator.share === "function" && estTactile();

        if (peutPartager && f && navigator.canShare?.({ files: [f] })) {
            navigator.share({ files: [f], text: texte }).catch(signalerEchec);
            return;
        }
        if (peutPartager) {
            navigator.share({ text: texte }).catch(signalerEchec);
            return;
        }

        // Ordinateur : l'image dans les téléchargements, le texte dans le presse-papiers.
        if (f) {
            const url = URL.createObjectURL(f);
            const a = document.createElement("a");
            a.href = url;
            a.download = nomFichier;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        navigator.clipboard.writeText(texte).then(
            () => toast.success(f ? "Image téléchargée, texte copié avec le lien du jeu" : "Texte copié avec le lien du jeu"),
            () => toast.error(f ? "Image téléchargée. La copie du texte a échoué." : "Le partage a échoué. Réessaie."),
        );
    }

    return (
        <button
            type="button"
            onClick={partager}
            aria-busy={!pret}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-marque-rouge-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600"
        >
            <Share2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Partager mon résultat
        </button>
    );
}

function signalerEchec(e: unknown) {
    if ((e as Error)?.name !== "AbortError") toast.error("Le partage a échoué. Réessaie.");
}

// Un ordinateur qui sait partager (Windows, macOS) le fait dans une
// petite fenêtre système peu parlante : on y préfère le téléchargement.
function estTactile() {
    return window.matchMedia("(pointer: coarse)").matches;
}

"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

// Le partage du défi du jour, un seul bouton (revu le 06/10/2026 avec John).
// Jusque-là, il joignait l'image du résultat en fichier. Mais l'image devait
// être chargée avant le toucher : sinon, seul le texte partait, et sur Android
// un échec renvoyait vers la galerie photo. Désormais on n'envoie que du texte,
// avec un lien qui porte le résultat (`/jeu?n=4&r=11110`) : c'est la messagerie
// qui dessine l'aperçu à partir de ce lien, avec le score du joueur
// (cf. generateMetadata de /jeu). Rien à attendre, rien qui puisse manquer.
// - sur téléphone, le bouton ouvre le menu de partage ;
// - ailleurs, il copie le texte, un toast le dit.

export function BoutonPartager({ numero, resultats }: { numero: number; resultats: boolean[] }) {
    const bits = resultats.map((r) => (r ? "1" : "0")).join("");
    const score = resultats.filter(Boolean).length;

    function partager() {
        const lien = `${window.location.origin}/jeu?n=${numero}&r=${bits}`;
        // Une idée par ligne : collé d'un bloc dans une publication, il était illisible.
        const texte = [
            `The Elsassisch · Le défi du jour n° ${numero}`,
            `${score}/${resultats.length} village${score > 1 ? "s" : ""} trouvé${score > 1 ? "s" : ""}`,
            resultats.map((r) => (r ? "🟩" : "⬜")).join(""),
            "",
            `À toi de jouer : ${lien}`,
        ].join("\n");

        if (typeof navigator.share === "function" && estTactile()) {
            navigator.share({ text: texte }).catch(signalerEchec);
            return;
        }
        navigator.clipboard.writeText(texte).then(
            () => toast.success("Texte copié. Colle-le dans un message pour le partager."),
            () => toast.error("La copie a échoué. Réessaie."),
        );
    }

    return (
        <button
            type="button"
            onClick={partager}
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
// petite fenêtre système peu parlante : on y préfère la copie.
function estTactile() {
    return window.matchMedia("(pointer: coarse)").matches;
}

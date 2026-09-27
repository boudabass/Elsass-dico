"use client";

import { ArrowRight } from "lucide-react";

import { useSens } from "@/components/sens-provider";
import { cn } from "@/lib/utils";

// L'inverseur de sens (27/09/2026, dessin de John) : deux boutons et une
// flèche. À gauche « Français », toujours bleu ; à droite « Alsacien »,
// toujours rouge ; la langue de départ est pleine, l'autre pâle dans sa propre
// couleur. La flèche du milieu part de la langue de départ et se retourne
// quand on inverse.
//
// Tout en haut, pleine largeur, et à la même place sur chaque écran connecté :
// monté une seule fois par RootLayout, jamais par un écran. Toucher une langue
// la prend comme départ ; toucher la flèche inverse.
//
// 51 px + 1 px de bordure = les 52 px que réserve --hauteur-inverseur : la
// bordure comptée en plus recouvrait d'un pixel le haut de l'en-tête.

const BOUTON =
  "flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg px-3 text-[15px] font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function InverseurSens() {
  const { sens, definirSens, inverser } = useSens();
  const depuisFrancais = sens === "fr";

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div role="group" aria-label="Sens du dictionnaire" className="flex h-[51px] items-center gap-2 px-3 md:px-4">
        <button
          type="button"
          aria-pressed={depuisFrancais}
          onClick={() => definirSens("fr")}
          className={cn(
            BOUTON,
            depuisFrancais ? "bg-bleu-500 text-white" : "bg-bleu-50 text-bleu-texte hover:bg-bleu-100",
          )}
        >
          Français
        </button>

        <button
          type="button"
          onClick={inverser}
          aria-label={depuisFrancais ? "Inverser : chercher depuis l'alsacien" : "Inverser : chercher depuis le français"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sens-texte transition-colors hover:bg-sens-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowRight
            aria-hidden
            strokeWidth={2.6}
            className={cn(
              "h-5 w-5 transition-transform duration-300 ease-out motion-reduce:transition-none",
              !depuisFrancais && "rotate-180",
            )}
          />
        </button>

        <button
          type="button"
          aria-pressed={!depuisFrancais}
          onClick={() => definirSens("als")}
          className={cn(
            BOUTON,
            depuisFrancais
              ? "bg-marque-rouge-50 text-marque-rouge-texte hover:bg-marque-rouge-100"
              : "bg-marque-rouge-500 text-white",
          )}
        >
          Alsacien
        </button>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {depuisFrancais ? "Du français vers l'alsacien" : "De l'alsacien vers le français"}
      </span>
    </div>
  );
}

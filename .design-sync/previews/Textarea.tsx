// Aperçu Textarea : la note d'arbitrage, seul champ libre du circuit de
// validation — c'est elle qui autorise une publication à source unique.
import { Label, Textarea } from "elsass-dico";

export function NoteDArbitrage() {
  return (
    <div className="max-w-md space-y-2">
      <Label htmlFor="na">Note d&rsquo;arbitrage</Label>
      <Textarea
        id="na"
        rows={4}
        placeholder="Pourquoi cette entrée peut être publiée avec une seule source…"
      />
    </div>
  );
}

export function Remplie() {
  return (
    <div className="max-w-md space-y-2">
      <Label htmlFor="nb">Note d&rsquo;arbitrage</Label>
      <Textarea
        id="nb"
        rows={4}
        defaultValue={
          "Témoignage d'un locuteur du Bas-Rhin, recoupé oralement. Publication décidée à la main : la règle des deux sources vise la reprise en masse d'un site scrapé, pas ce cas."
        }
      />
    </div>
  );
}

export function Desactivee() {
  return (
    <div className="max-w-md space-y-2">
      <Label htmlFor="nc">Note figée</Label>
      <Textarea id="nc" rows={3} defaultValue="Arbitrée le 24/08/2026." disabled />
    </div>
  );
}

// Aperçu RadioGroup : le geste central de l'onglet « Divergentes » — choisir
// laquelle des graphies attestées devient canonique.
//
// Les deux graphies proposées sont celles réellement attestées pour Rangen.
import { Label, RadioGroup, RadioGroupItem } from "elsass-dico";

export function ChoisirLaGraphieCanonique() {
  return (
    <div className="max-w-sm space-y-3">
      <p className="text-sm font-medium">
        Rangen — deux sources, deux graphies
      </p>
      <RadioGroup defaultValue="range-accent">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="range-accent" id="g1" />
          <Label htmlFor="g1" className="font-mono">
            Rànge
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="range-nu" id="g2" />
          <Label htmlFor="g2" className="font-mono">
            Range
          </Label>
        </div>
      </RadioGroup>
      <p className="text-sm text-muted-foreground">
        La forme retenue passe en tête ; l&rsquo;autre est conservée en variante.
      </p>
    </div>
  );
}

export function Horizontal() {
  return (
    <RadioGroup defaultValue="br" className="flex gap-6">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="br" id="h1" />
        <Label htmlFor="h1">Bas-Rhin</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="hr" id="h2" />
        <Label htmlFor="h2">Haut-Rhin</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="tous" id="h3" />
        <Label htmlFor="h3">Les deux</Label>
      </div>
    </RadioGroup>
  );
}

export function Desactive() {
  return (
    <RadioGroup defaultValue="a" disabled className="space-y-1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="a" id="d1" />
        <Label htmlFor="d1" className="text-muted-foreground">
          Entrée déjà publiée
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="b" id="d2" />
        <Label htmlFor="d2" className="text-muted-foreground">
          Variante figée
        </Label>
      </div>
    </RadioGroup>
  );
}

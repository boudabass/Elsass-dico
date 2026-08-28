// Aperçu Checkbox : les filtres de la file d'arbitrage.
import { Checkbox, Label } from "elsass-dico";

export function Filtres() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="f1" defaultChecked />
        <Label htmlFor="f1">Toponymes</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="f2" defaultChecked />
        <Label htmlFor="f2">Prénoms</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="f3" />
        <Label htmlFor="f3">Lexique général</Label>
      </div>
    </div>
  );
}

export function Etats() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="e1" />
        <Label htmlFor="e1">Décochée</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="e2" defaultChecked />
        <Label htmlFor="e2">Cochée</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="e3" disabled />
        <Label htmlFor="e3" className="text-muted-foreground">
          Désactivée
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="e4" defaultChecked disabled />
        <Label htmlFor="e4" className="text-muted-foreground">
          Cochée et désactivée
        </Label>
      </div>
    </div>
  );
}

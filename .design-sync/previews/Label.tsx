// Aperçu Label : jamais seul — il n'existe qu'attaché à un contrôle.
import { Checkbox, Input, Label, Textarea } from "elsass-dico";

export function SurUnChamp() {
  return (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="als">Forme alsacienne</Label>
      <Input id="als" defaultValue="Nàswil" />
    </div>
  );
}

export function SurUneCase() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="dep" defaultChecked />
      <Label htmlFor="dep">N&rsquo;afficher que les entrées à deux sources</Label>
    </div>
  );
}

export function SurUneZoneDeTexte() {
  return (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="note">Note d&rsquo;arbitrage</Label>
      <Textarea id="note" rows={3} placeholder="Motiver la décision…" />
    </div>
  );
}

// Aperçu Switch : bascules d'affichage de la file d'arbitrage.
import { Label, Switch } from "elsass-dico";

export function Bascules() {
  return (
    <div className="max-w-sm space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="s1">Afficher les variantes</Label>
        <Switch id="s1" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="s2">Masquer les entrées à une source</Label>
        <Switch id="s2" />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="s3" className="text-muted-foreground">
          Publication automatique
        </Label>
        <Switch id="s3" disabled />
      </div>
    </div>
  );
}

export function Etats() {
  return (
    <div className="flex items-center gap-6">
      <Switch />
      <Switch defaultChecked />
      <Switch disabled />
      <Switch defaultChecked disabled />
    </div>
  );
}

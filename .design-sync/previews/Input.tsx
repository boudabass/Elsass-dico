// Aperçu Input. Le champ de recherche est le cœur de cette app : sa bordure
// utilise --input (3,02:1 sur blanc), volontairement plus marquée que --border.
import { Input, Label } from "elsass-dico";

export function ChampDeRecherche() {
  return (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="q">Chercher un mot</Label>
      <Input id="q" placeholder="français ou alsacien…" />
      <p className="text-sm text-muted-foreground">
        La recherche fonctionne dans les deux sens.
      </p>
    </div>
  );
}

export function Rempli() {
  return (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="fr">Français</Label>
      <Input id="fr" defaultValue="Benfeld" />
    </div>
  );
}

export function Types() {
  return (
    <div className="max-w-sm space-y-3">
      <Input type="email" placeholder="contributeur@exemple.fr" />
      <Input type="password" defaultValue="motdepasse" />
      <Input type="number" defaultValue={2} />
    </div>
  );
}

export function Desactive() {
  return (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="fig">Contribution figée</Label>
      <Input id="fig" defaultValue="Banfald" disabled />
      <p className="text-sm text-muted-foreground">
        Retenue dans une entrée : ni modifiable ni supprimable.
      </p>
    </div>
  );
}

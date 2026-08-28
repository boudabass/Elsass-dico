// Aperçu Select. Le panneau ouvert passe par un portail Radix : il ne se rend
// pas dans une carte statique. Les cellules montrent donc l'état fermé, qui est
// aussi celui que l'utilisateur voit 99 % du temps.
import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "elsass-dico";

export function FiltrerParSource() {
  return (
    <div className="max-w-xs space-y-2">
      <Label htmlFor="src">Source</Label>
      <Select defaultValue="culture_alsace">
        <SelectTrigger id="src">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sources lexicales</SelectLabel>
            <SelectItem value="culture_alsace">culture_alsace</SelectItem>
            <SelectItem value="wiktionnaire_fr">wiktionnaire_fr</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Autres</SelectLabel>
            <SelectItem value="alsacien_wikipedia">alsacien_wikipedia</SelectItem>
            <SelectItem value="martin_lienhart">martin_lienhart</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function SansValeur() {
  return (
    <div className="max-w-xs space-y-2">
      <Label htmlFor="typ">Type de terme</Label>
      <Select>
        <SelectTrigger id="typ">
          <SelectValue placeholder="Tous les types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mot">Mot</SelectItem>
          <SelectItem value="expression">Expression</SelectItem>
          <SelectItem value="toponyme">Toponyme</SelectItem>
          <SelectItem value="prenom">Prénom</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Desactive() {
  return (
    <div className="max-w-xs space-y-2">
      <Label htmlFor="fig" className="text-muted-foreground">
        Statut (verrouillé)
      </Label>
      <Select defaultValue="valide" disabled>
        <SelectTrigger id="fig">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="valide">Validé</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

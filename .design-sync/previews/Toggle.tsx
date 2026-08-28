// Aperçu Toggle : un bouton à deux états, pas une case à cocher — il porte une
// action qu'on active, pas une valeur qu'on renseigne.
import { Toggle } from "elsass-dico";
import { ArrowLeftRight, Eye } from "lucide-react";

export function Etats() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle>Inactif</Toggle>
      <Toggle defaultPressed>Actif</Toggle>
      <Toggle disabled>Désactivé</Toggle>
    </div>
  );
}

export function AvecIcone() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle aria-label="Inverser le sens de traduction">
        <ArrowLeftRight />
      </Toggle>
      <Toggle defaultPressed aria-label="Afficher les sources">
        <Eye />
      </Toggle>
      <Toggle defaultPressed>
        <Eye />
        Sources visibles
      </Toggle>
    </div>
  );
}

export function Variantes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="default">Défaut</Toggle>
      <Toggle variant="outline">Contour</Toggle>
      <Toggle variant="outline" defaultPressed>
        Contour actif
      </Toggle>
    </div>
  );
}

export function Tailles() {
  // variant="outline" : un Toggle par défaut non pressé est transparent, et
  // trois tailles transparentes se lisent comme trois libellés — l'axe de
  // variation disparaîtrait de la carte.
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="outline" size="sm">
        Petit
      </Toggle>
      <Toggle variant="outline" size="default">
        Normal
      </Toggle>
      <Toggle variant="outline" size="lg">
        Grand
      </Toggle>
    </div>
  );
}

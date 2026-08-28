// Aperçu Button. Contenu tiré de l'usage réel de l'app (arbitrage, recherche).
//
// Les libellés d'export servent d'intitulé de cellule et sont filtrés sur
// /^[A-Z]/ : un nom accentué (« États ») serait silencieusement ignoré. D'où
// les noms sans accent ci-dessous.
import { Button } from "elsass-dico";
import { Check, Search, X } from "lucide-react";

export function Variantes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Valider l&rsquo;entrée</Button>
      <Button variant="secondary">Voir les sources</Button>
      <Button variant="outline">Passer</Button>
      <Button variant="ghost">Annuler</Button>
      <Button variant="destructive">Rejeter</Button>
      <Button variant="link">Détail de l&rsquo;entrée</Button>
    </div>
  );
}

export function Tailles() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Arbitrer</Button>
      <Button size="default">Arbitrer</Button>
      <Button size="lg">Arbitrer</Button>
      <Button size="icon" aria-label="Rechercher">
        <Search />
      </Button>
    </div>
  );
}

export function AvecIcone() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Check />
        Publier la forme canonique
      </Button>
      <Button variant="outline">
        <Search />
        Chercher dans les attestations
      </Button>
      <Button variant="destructive">
        <X />
        Retirer l&rsquo;attestation
      </Button>
    </div>
  );
}

export function Etats() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Valider (2 sources requises)</Button>
      <Button variant="outline" disabled>
        Indisponible
      </Button>
      <Button variant="secondary" disabled>
        En cours…
      </Button>
    </div>
  );
}

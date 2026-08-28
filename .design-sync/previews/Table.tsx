// Aperçu Table : la file d'arbitrage, telle que /admin/arbitrage la présente.
//
// Toutes les formes alsaciennes ci-dessous sont attestées et documentées
// (formes publiées ou divergences réelles relevées entre sources). Règle 1 :
// aucune forme inventée, pas même pour un exemple.
import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "elsass-dico";

const RECOUPEES = [
  { fr: "Benfeld", als: "Banfald", sources: 2 },
  { fr: "Natzwiller", als: "Nàswil", sources: 2 },
  { fr: "Barr", als: "Bàrr", sources: 2 },
  { fr: "juillet", als: "Jüli", sources: 2 },
];

const DIVERGENTES = [
  { fr: "Rangen", formes: ["Rànge", "Range"] },
  { fr: "Bischwiller", formes: ["Bischwiller", "Bìschwiller"] },
  { fr: "Wolschwiller", formes: ["Wolschwiller", "Wolschwìller"] },
];

export function FileDArbitrage() {
  return (
    <Table>
      <TableCaption>
        Candidats dont deux sources écrivent la même forme.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Français</TableHead>
          <TableHead>Alsacien</TableHead>
          <TableHead className="text-right">Sources</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {RECOUPEES.map((l) => (
          <TableRow key={l.fr}>
            <TableCell className="font-medium">{l.fr}</TableCell>
            <TableCell>{l.als}</TableCell>
            <TableCell className="text-right tabular-nums">
              {l.sources}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function Divergences() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Français</TableHead>
          <TableHead>Formes attestées</TableHead>
          <TableHead className="text-right">État</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {DIVERGENTES.map((l) => (
          <TableRow key={l.fr}>
            <TableCell className="font-medium">{l.fr}</TableCell>
            <TableCell>
              {/* Séparateur explicite : deux graphies ne différant que d'un
                  diacritique se lisent comme un doublon si rien ne les sépare. */}
              <span className="font-mono text-sm">{l.formes.join("  /  ")}</span>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="outline">à arbitrer</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

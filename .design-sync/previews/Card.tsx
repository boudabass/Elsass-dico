// Aperçu Card, dans sa composition réelle : Card > CardHeader > CardTitle +
// CardDescription > CardContent > CardFooter.
//
// Les formes alsaciennes affichées sont des formes ATTESTÉES et publiées de la
// base (Benfeld → Banfald, Rangen → Rànge/Range). Règle 1 du dépôt : on
// n'invente jamais une traduction, même pour un exemple.
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "elsass-dico";

export function EntreeDuDictionnaire() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Benfeld</CardTitle>
        <CardDescription>Toponyme · Bas-Rhin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-semibold tracking-tight">Banfald</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">culture_alsace</Badge>
          <Badge variant="secondary">alsacien_wikipedia</Badge>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-sm text-muted-foreground">2 attestations</span>
        <Button variant="outline" size="sm">
          Voir les sources
        </Button>
      </CardFooter>
    </Card>
  );
}

export function FormeCanoniqueEtVariante() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Rangen</CardTitle>
        <CardDescription>
          Premier est Roi : la forme retenue est en tête, la variante suit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-1">
          <li className="flex items-center gap-2">
            <span className="text-lg font-semibold">Rànge</span>
            <Badge>canonique</Badge>
          </li>
          <li className="text-muted-foreground">Range</li>
        </ol>
      </CardContent>
    </Card>
  );
}

export function CarteSobre() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Entrées publiées</CardTitle>
        <CardDescription>Statut « valide »</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-semibold tabular-nums">332</p>
        <p className="mt-1 text-sm text-muted-foreground">
          329 toponymes, 3 mois de l&rsquo;année
        </p>
      </CardContent>
    </Card>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, ArrowRight, AlertTriangle, Users } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import {
  listerCandidats,
  listerCandidatsDivergents,
  listerCandidatsRecoupes,
  listerEntrees,
  type Candidat,
  type CandidatDivergent,
  type CandidatRecoupe,
  type EntreeListee,
} from "@/app/actions/arbitrage";
import {
  estTypeTermeValide,
  LIBELLES_STATUT,
  LIBELLES_TYPE_TERME,
  SOURCES_MINIMUM,
  TYPES_TERME,
  type StatutEntree,
  type TypeTerme,
} from "@/lib/dictionnaire";
import { OngletRecoupes } from "./onglet-recoupes";
import { OngletDivergentes } from "./onglet-divergentes";
import { lienArbitrage } from "./liens";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { useScrollMemorise } from "@/hooks/use-scroll-memorise";
import { cleCache, invaliderCache } from "@/lib/cache-navigation";

interface DonneesArbitrage {
  candidats: Candidat[];
  recoupes: CandidatRecoupe[];
  divergents: CandidatDivergent[];
  entrees: EntreeListee[];
}

// listerCandidats() et listerEntrees() plafonnent à 50 (p_limite du RPC). Une
// liste pleine signale donc « au moins 50 », jamais « exactement 50 » : afficher
// le nombre brut ferait lire une taille de page comme un total — 169 entrées
// s'affichaient « 50 ». Les onglets Recoupées et Divergentes ne sont pas
// concernés : ils paginent jusqu'à épuisement des candidats à plusieurs sources,
// leur compteur est donc un vrai total.
const PAGE_RPC = 50;
function compteur(n: number) {
  return n >= PAGE_RPC ? `${PAGE_RPC}+` : `${n}`;
}

// Valeur du Select pour « aucun filtre » : le paramètre d'URL ?type= est alors
// simplement absent, jamais une chaîne vide passée à un SelectItem (interdit
// par shadcn/Radix, qui réserve la chaîne vide au placeholder interne).
const TOUS_LES_TYPES = "__tous__";

export default function FileArbitragePage() {
  // useSearchParams() impose une frontière Suspense, sans quoi `next build`
  // échoue sur « should be wrapped in a suspense boundary » — même scission
  // que / et /dictionnaire depuis la PR #22.
  return (
    <Suspense
      fallback={<AppHeader variant="stack" actif="arbitrage" titre="Arbitrage" backHref="/dashboard" />}
    >
      <FileArbitrageContenu />
    </Suspense>
  );
}

function FileArbitrageContenu() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filtre et onglet actif portés par l'URL, comme la lettre du dictionnaire
  // et le terme de la recherche. Le Tabs était jusqu'ici non contrôlé
  // (defaultValue) : revenir d'une fiche candidat ouverte depuis
  // « Divergentes » retombait toujours sur « Recoupées ».
  const termeUrl = searchParams.get("q") ?? "";
  const ongletUrl = searchParams.get("onglet") ?? "recoupes";
  const typeParam = searchParams.get("type") ?? "";
  // Un ?type= invalide (lien copié, ancienne valeur) redevient « tous » plutôt
  // que de planter la requête : estTypeTermeValide() garde aussi ce filtre,
  // comme elle garde déjà arbitrerAction().
  const typeUrl = estTypeTermeValide(typeParam) ? typeParam : "";
  const [terme, setTerme] = useState(termeUrl);

  const majUrl = (recherche: string, onglet: string, type: string) => {
    const params = new URLSearchParams();
    if (recherche) params.set("q", recherche);
    if (onglet !== "recoupes") params.set("onglet", onglet);
    if (type) params.set("type", type);
    const requete = params.toString();
    // replace, pas push : sinon chaque onglet cliqué empilerait une entrée
    // d'historique à remonter une par une au retour.
    router.replace(requete ? `/admin/arbitrage?${requete}` : "/admin/arbitrage", { scroll: false });
  };

  const cle = user && role === "admin" ? cleCache("arbitrage", user.id, termeUrl, typeUrl) : null;
  const { donnees, premierChargement, rafraichir } = useListeMemorisee<DonneesArbitrage>({
    cle,
    charger: async () => {
      const type = estTypeTermeValide(typeUrl) ? typeUrl : undefined;
      const [c, r, d, e] = await Promise.all([
        listerCandidats(termeUrl, type),
        listerCandidatsRecoupes(termeUrl, type),
        listerCandidatsDivergents(termeUrl, type),
        listerEntrees(undefined, termeUrl),
      ]);
      return { candidats: c, recoupes: r, divergents: d, entrees: e };
    },
  });

  const candidats = donnees?.candidats ?? [];
  const recoupes = donnees?.recoupes ?? [];
  const divergents = donnees?.divergents ?? [];
  const entrees = donnees?.entrees ?? [];
  const chargement = premierChargement || (cle !== null && donnees === null);

  // L'onglet entre dans la clé de scroll (il change ce qui est rendu) mais pas
  // dans celle des données : les quatre listes sont chargées ensemble et leurs
  // quatre compteurs s'affichent en même temps sur la TabsList.
  useScrollMemorise(cle ? cleCache(cle, ongletUrl) : null, donnees !== null);

  // Publier retire les candidats de la file et rend l'entrée publique : les
  // autres écrans doivent oublier ce qu'ils gardaient en mémoire, sinon on
  // réafficherait une file déjà arbitrée ou un dictionnaire d'avant. Le
  // préfixe emporte tous les filtres, pas seulement celui affiché.
  const apresPublication = async () => {
    invaliderCache("arbitrage");
    invaliderCache("dashboard");
    invaliderCache("recherche");
    invaliderCache("dictionnaire");
    await rafraichir();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!user || role !== "admin") return <div className="p-8 text-center">Accès refusé</div>;

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader
        variant="stack"
        actif="arbitrage"
        titre="Arbitrage"
        backHref="/dashboard"
        trailing={
          <Link
            href="/admin"
            aria-label="Utilisateurs"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutre-100 text-foreground"
          >
            <Users className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
        }
      />
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <p className="text-muted-foreground text-sm text-pretty">
        Une entrée n&apos;est retenue qu&apos;après recoupement. Les candidats attestés par
        plusieurs sources indépendantes remontent en premier.
      </p>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          // Le filtre passe par l'URL : c'est le changement de `q` qui change
          // la clé de cache et déclenche (ou non) le chargement.
          majUrl(terme.trim(), ongletUrl, typeUrl);
        }}
      >
        <Input
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          placeholder="Filtrer sur le français…"
          className="h-10"
          aria-label="Filtrer les candidats sur le français"
        />
        <Button type="submit" variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label="Filtrer">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {/* Sans ce filtre, les candidats à 2+ sources (93 % de toponymes,
          mesuré le 04/09/2026) saturent les 50 premières lignes de « File
          d'arbitrage » et masquent le lexique général — la recherche sur le
          français ne suffit pas quand on ne cherche pas un mot précis. */}
      <div className="flex items-center gap-2">
        <Label htmlFor="filtre-type" className="text-sm text-muted-foreground shrink-0">
          Type
        </Label>
        <Select
          value={typeUrl || TOUS_LES_TYPES}
          onValueChange={(valeur) => majUrl(termeUrl, ongletUrl, valeur === TOUS_LES_TYPES ? "" : valeur)}
        >
          <SelectTrigger id="filtre-type" className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS_LES_TYPES}>Tous les types</SelectItem>
            {TYPES_TERME.map((t) => (
              <SelectItem key={t} value={t}>
                {LIBELLES_TYPE_TERME[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={ongletUrl} onValueChange={(onglet) => majUrl(termeUrl, onglet, typeUrl)}>
        {/* tabular-nums : ces compteurs se décrémentent à chaque publication.
            Avec des chiffres proportionnels, la largeur des onglets bouge sous
            le curseur au moment précis où l'on enchaîne les arbitrages. */}
        <TabsList className="h-auto flex-wrap tabular-nums">
          <TabsTrigger value="recoupes" className="min-h-10">Recoupées ({recoupes.length})</TabsTrigger>
          <TabsTrigger value="divergentes" className="min-h-10">Divergentes ({divergents.length})</TabsTrigger>
          <TabsTrigger value="candidats" className="min-h-10">File d&apos;arbitrage ({compteur(candidats.length)})</TabsTrigger>
          <TabsTrigger value="entrees" className="min-h-10">Entrées existantes ({compteur(entrees.length)})</TabsTrigger>
        </TabsList>

        <TabsContent value="recoupes" className="mt-4">
          <OngletRecoupes
            recoupes={recoupes}
            chargement={chargement}
            onPublie={apresPublication}
          />
        </TabsContent>
        <TabsContent value="divergentes" className="mt-4">
          <OngletDivergentes
            divergents={divergents}
            chargement={chargement}
            onPublie={apresPublication}
          />
        </TabsContent>
        <TabsContent value="candidats" className="mt-4">
          {chargement ? (
            <p className="text-center py-8 text-muted-foreground">Chargement…</p>
          ) : candidats.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aucun candidat</CardTitle>
                <CardDescription>
                  Toutes les attestations connues sont déjà rattachées à une entrée, ou aucune
                  n&apos;a encore été saisie. Les contributions et les imports alimentent cette file.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            /* `block` + anneau porté par le lien : un <a> inline autour d'une
               Card ne prend pas le focus visible au clavier, et `cursor-pointer`
               ne compensait que pour la souris. */
            <div className="space-y-3">
              {candidats.map((c) => (
                <Link
                  key={`${c.cle}|${c.contexte}`}
                  href={lienArbitrage(c.cle, c.contexte)}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{c.francais}</span>
                          {c.contexte && (
                            <Badge variant="outline" className="font-normal">
                              {c.contexte}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="font-normal">
                            {LIBELLES_TYPE_TERME[c.type as TypeTerme] ?? c.type}
                          </Badge>
                          {c.entree_id && (
                            <Badge variant="outline" className="font-normal text-sky-600 border-sky-300">
                              Enrichit une entrée existante
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {c.variantes.map((v) => v.alsacien).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.nb_sources < SOURCES_MINIMUM ? (
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                            <AlertTriangle className="w-3 h-3" /> 1 source
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">
                            {c.nb_sources} sources
                          </Badge>
                        )}
                        <Badge variant="secondary" className="tabular-nums">
                          {c.nb_attestations} attest.
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="entrees" className="mt-4">
          {chargement ? (
            <p className="text-center py-8 text-muted-foreground">Chargement…</p>
          ) : entrees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucune entrée pour l&apos;instant.</p>
          ) : (
            <div className="space-y-3">
              {entrees.map((e) => (
                <Link
                  key={e.id}
                  href={lienArbitrage(e.cle, e.contexte)}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{e.francais}</span>
                          {e.contexte && (
                            <Badge variant="outline" className="font-normal">
                              {e.contexte}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {e.traductions.map((t) => t.alsacien).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={e.statut === "valide" ? "default" : "secondary"}
                          className={e.statut === "valide" ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                        >
                          {LIBELLES_STATUT[e.statut as StatutEntree] ?? e.statut}
                        </Badge>
                        <Badge variant="secondary" className="tabular-nums">
                          {e.nb_attestations} attest.
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

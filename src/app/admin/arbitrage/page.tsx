"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Scale, Search, ArrowRight, AlertTriangle } from "lucide-react";
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
  LIBELLES_STATUT,
  LIBELLES_TYPE_TERME,
  SOURCES_MINIMUM,
  type StatutEntree,
  type TypeTerme,
} from "@/lib/dictionnaire";
import { OngletRecoupes } from "./onglet-recoupes";
import { OngletDivergentes } from "./onglet-divergentes";
import { lienArbitrage } from "./liens";

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

export default function FileArbitragePage() {
  const { user, role, isLoading } = useAuth();
  const [terme, setTerme] = useState("");
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [recoupes, setRecoupes] = useState<CandidatRecoupe[]>([]);
  const [divergents, setDivergents] = useState<CandidatDivergent[]>([]);
  const [entrees, setEntrees] = useState<EntreeListee[]>([]);
  const [chargement, setChargement] = useState(true);

  const rafraichir = async (recherche: string) => {
    setChargement(true);
    const [c, r, d, e] = await Promise.all([
      listerCandidats(recherche),
      listerCandidatsRecoupes(recherche),
      listerCandidatsDivergents(recherche),
      listerEntrees(undefined, recherche),
    ]);
    setCandidats(c);
    setRecoupes(r);
    setDivergents(d);
    setEntrees(e);
    setChargement(false);
  };

  useEffect(() => {
    rafraichir("");
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!user || role !== "admin") return <div className="p-8 text-center">Accès refusé</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="w-7 h-7" /> Arbitrage
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Une entrée n&apos;est retenue qu&apos;après recoupement. Les candidats attestés par
            plusieurs sources indépendantes remontent en premier.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Utilisateurs</Button>
        </Link>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          rafraichir(terme);
        }}
      >
        <Input
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          placeholder="Filtrer sur le français…"
        />
        <Button type="submit" variant="outline">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      <Tabs defaultValue="recoupes">
        <TabsList>
          <TabsTrigger value="recoupes">Recoupées ({recoupes.length})</TabsTrigger>
          <TabsTrigger value="divergentes">Divergentes ({divergents.length})</TabsTrigger>
          <TabsTrigger value="candidats">File d&apos;arbitrage ({compteur(candidats.length)})</TabsTrigger>
          <TabsTrigger value="entrees">Entrées existantes ({compteur(entrees.length)})</TabsTrigger>
        </TabsList>

        <TabsContent value="recoupes" className="mt-4">
          <OngletRecoupes
            recoupes={recoupes}
            chargement={chargement}
            onPublie={() => rafraichir(terme)}
          />
        </TabsContent>
        <TabsContent value="divergentes" className="mt-4">
          <OngletDivergentes
            divergents={divergents}
            chargement={chargement}
            onPublie={() => rafraichir(terme)}
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
            <div className="space-y-3">
              {candidats.map((c) => (
                <Link key={`${c.cle}|${c.contexte}`} href={lienArbitrage(c.cle, c.contexte)}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
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
                        <Badge variant="secondary">{c.nb_attestations} attest.</Badge>
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
                <Link key={e.id} href={lienArbitrage(e.cle, e.contexte)}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
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
                        <Badge variant="secondary">{e.nb_attestations} attest.</Badge>
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
  );
}

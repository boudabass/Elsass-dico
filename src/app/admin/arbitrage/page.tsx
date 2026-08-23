"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Scale, Search, ArrowRight, AlertTriangle, Crown, ShieldCheck } from "lucide-react";
import {
  listerCandidats,
  listerCandidatsRecoupes,
  listerEntrees,
  arbitrerLotAction,
  type BilanLot,
  type Candidat,
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

function lienArbitrage(cle: string, contexte: string) {
  const query = contexte ? `?contexte=${encodeURIComponent(contexte)}` : "";
  return `/admin/arbitrage/${encodeURIComponent(cle)}${query}`;
}

function cleDe(c: { cle: string; contexte: string }) {
  return `${c.cle}|${c.contexte}`;
}

// listerCandidats() et listerEntrees() plafonnent à 50 (p_limite du RPC). Une
// liste pleine signale donc « au moins 50 », jamais « exactement 50 » : afficher
// le nombre brut ferait lire une taille de page comme un total — 169 entrées
// s'affichaient « 50 ». L'onglet Recoupées n'est pas concerné, il pagine
// jusqu'à épuisement.
const PAGE_RPC = 50;
function compteur(n: number) {
  return n >= PAGE_RPC ? `${PAGE_RPC}+` : `${n}`;
}

export default function FileArbitragePage() {
  const { user, role, isLoading } = useAuth();
  const [terme, setTerme] = useState("");
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [recoupes, setRecoupes] = useState<CandidatRecoupe[]>([]);
  const [entrees, setEntrees] = useState<EntreeListee[]>([]);
  const [chargement, setChargement] = useState(true);
  const [selection, setSelection] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [bilan, setBilan] = useState<BilanLot | null>(null);

  const rafraichir = async (recherche: string) => {
    setChargement(true);
    const [c, r, e] = await Promise.all([
      listerCandidats(recherche),
      listerCandidatsRecoupes(recherche),
      listerEntrees(undefined, recherche),
    ]);
    setCandidats(c);
    setRecoupes(r);
    setEntrees(e);
    // Le lot par défaut est la sélection complète : c'est le geste courant,
    // décocher reste possible pour écarter un candidat douteux.
    setSelection(r.map(cleDe));
    setChargement(false);
  };

  useEffect(() => {
    rafraichir("");
  }, []);

  const basculer = (cle: string) =>
    setSelection((s) => (s.includes(cle) ? s.filter((x) => x !== cle) : [...s, cle]));

  const validerLot = async () => {
    setEnCours(true);
    setBilan(null);
    const choisis = recoupes.filter((c) => selection.includes(cleDe(c)));
    const resultat = await arbitrerLotAction(
      choisis.map((c) => ({ cle: c.cle, contexte: c.contexte })),
    );
    setBilan(resultat);
    if (resultat.reussies > 0) {
      toast.success(`${resultat.reussies} entrée(s) publiée(s)`);
    }
    if (resultat.echecs.length > 0) {
      toast.error(`${resultat.echecs.length} échec(s) — voir le détail`);
    }
    await rafraichir(terme);
    setEnCours(false);
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
          <TabsTrigger value="candidats">File d&apos;arbitrage ({compteur(candidats.length)})</TabsTrigger>
          <TabsTrigger value="entrees">Entrées existantes ({compteur(entrees.length)})</TabsTrigger>
        </TabsList>

        <TabsContent value="recoupes" className="mt-4 space-y-4">
          <Card className="border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Publiables sans arbitrage manuel
              </CardTitle>
              <CardDescription>
                Ces candidats ne sont pas seulement attestés par {SOURCES_MINIMUM} sources : ces
                sources <strong>écrivent la même forme alsacienne</strong>. C&apos;est le recoupement
                au sens de la règle 2. Quand les sources divergent sur la forme, le candidat reste
                dans la file d&apos;arbitrage — choisir la forme canonique est un arbitrage, pas un
                traitement de masse.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 flex-wrap pt-0">
              <p className="text-sm text-muted-foreground">
                {selection.length} sélectionnée(s) sur {recoupes.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={enCours || recoupes.length === 0}
                  onClick={() =>
                    setSelection(selection.length === recoupes.length ? [] : recoupes.map(cleDe))
                  }
                >
                  {selection.length === recoupes.length ? "Tout décocher" : "Tout cocher"}
                </Button>
                <Button
                  disabled={enCours || selection.length === 0}
                  onClick={validerLot}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {enCours ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publication…
                    </>
                  ) : (
                    `Valider et publier (${selection.length})`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {bilan && (
            <Card className={bilan.echecs.length > 0 ? "border-amber-300" : "border-emerald-300"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {bilan.reussies} publiée(s), {bilan.echecs.length} échec(s)
                </CardTitle>
              </CardHeader>
              {bilan.echecs.length > 0 && (
                <CardContent className="pt-0 space-y-1">
                  {bilan.echecs.map((e, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{e.francais}</span>
                      {e.contexte && ` (${e.contexte})`} — {e.message}
                    </p>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {chargement ? (
            <p className="text-center py-8 text-muted-foreground">Chargement…</p>
          ) : recoupes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aucun candidat recoupé</CardTitle>
                <CardDescription>
                  Aucun candidat n&apos;a deux sources écrivant la même forme alsacienne. Les
                  candidats à sources divergentes sont dans la file d&apos;arbitrage.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-3">
              {recoupes.map((c) => {
                const k = cleDe(c);
                return (
                  <Card key={k}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Checkbox
                        checked={selection.includes(k)}
                        onCheckedChange={() => basculer(k)}
                        disabled={enCours}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
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
                        </div>
                        <p className="text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {c.formeCanonique}
                          </span>
                          {c.traductions.length > 1 && (
                            <span className="text-muted-foreground">
                              · aussi {c.traductions.slice(1).map((t) => t.alsacien).join(" · ")}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">
                          {c.nb_sources} sources
                        </Badge>
                        <Link href={lienArbitrage(c.cle, c.contexte)}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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

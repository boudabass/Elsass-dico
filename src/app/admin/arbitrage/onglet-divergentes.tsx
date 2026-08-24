"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight, Crown, GitFork, Sparkles } from "lucide-react";
import { arbitrerDivergenceAction, type CandidatDivergent } from "@/app/actions/arbitrage";
import { LIBELLES_TYPE_TERME, type TypeTerme } from "@/lib/dictionnaire";
import { lienArbitrage } from "./liens";

function cleDe(c: { cle: string; contexte: string }) {
  return `${c.cle}|${c.contexte}`;
}

interface Props {
  divergents: CandidatDivergent[];
  chargement: boolean;
  // Publier retire le candidat de la file : les onglets changent ensemble.
  onPublie: () => Promise<void>;
}

export function OngletDivergentes({ divergents, chargement, onPublie }: Props) {
  // Une seule décision en cours à la fois : la clé du candidat qu'on publie.
  const [enCours, setEnCours] = useState<string | null>(null);

  const choisir = async (candidat: CandidatDivergent, graphie: string) => {
    setEnCours(cleDe(candidat));
    const resultat = await arbitrerDivergenceAction({
      cle: candidat.cle,
      contexte: candidat.contexte,
      graphie,
    });
    if (resultat.success) {
      toast.success(`${candidat.francais} — publiée avec « ${graphie} »`);
      await onPublie();
    } else {
      toast.error(resultat.error);
    }
    setEnCours(null);
  };

  const faciles = divergents.filter((c) => c.diacritiquesSeuls).length;

  return (
    <div className="space-y-4">
      <Card className="border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitFork className="w-4 h-4 text-amber-600" /> Sources en désaccord sur la forme
          </CardTitle>
          <CardDescription>
            Ces candidats sont attestés par plusieurs sources, mais aucune forme alsacienne
            n&apos;est écrite pareil par deux d&apos;entre elles. La doctrine les envoie à
            l&apos;arbitrage manuel : <strong>choisir la graphie canonique est un arbitrage</strong>,
            il ne se traite pas en lot. Chaque clic publie une seule entrée, avec une forme copiée
            telle quelle d&apos;une attestation — les autres formes sont conservées en variantes.
            {faciles > 0 && (
              <>
                {" "}
                <strong>{faciles}</strong> ne diffèrent que par un accent et remontent en tête :
                elles se tranchent à la règle ORTHAL.
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {chargement ? (
        <p className="text-center py-8 text-muted-foreground">Chargement…</p>
      ) : divergents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aucune divergence en attente</CardTitle>
            <CardDescription>
              Tous les candidats à plusieurs sources voient ces sources s&apos;accorder sur une
              forme — ou ont déjà été arbitrés. Un onglet vide après publication est normal : une
              attestation rattachée à une entrée quitte la file.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {divergents.map((c) => {
            const k = cleDe(c);
            const occupe = enCours === k;
            return (
              <Card key={k} className={c.diacritiquesSeuls ? "border-amber-300/70" : undefined}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-semibold">{c.francais}</span>
                      {c.contexte && (
                        <Badge variant="outline" className="font-normal">
                          {c.contexte}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="font-normal">
                        {LIBELLES_TYPE_TERME[c.type as TypeTerme] ?? c.type}
                      </Badge>
                      {c.diacritiquesSeuls && (
                        <Badge
                          variant="outline"
                          className="font-normal gap-1 text-amber-700 border-amber-400 dark:text-amber-400"
                        >
                          <Sparkles className="w-3 h-3" /> accents seuls
                        </Badge>
                      )}
                      {c.entree_id && (
                        <Badge variant="outline" className="font-normal text-sky-600 border-sky-300">
                          Enrichit une entrée existante
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        {c.nb_sources} sources
                      </Badge>
                      <Link href={lienArbitrage(c.cle, c.contexte)}>
                        <Button variant="ghost" size="sm" title="Ouvrir l'écran d'arbitrage complet">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {c.formes.map((f) => (
                      <Button
                        key={f.graphie}
                        variant="outline"
                        size="sm"
                        disabled={occupe}
                        onClick={() => choisir(c, f.graphie)}
                        className="h-auto py-1.5 gap-2 font-normal"
                        title={`Publier « ${f.graphie} » comme forme canonique`}
                      >
                        {occupe ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {f.graphie}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {f.nbSources} src · {f.nbAttestations} att.
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

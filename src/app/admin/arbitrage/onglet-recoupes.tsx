"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowRight, Crown, ShieldCheck } from "lucide-react";
import { arbitrerLotAction, type BilanLot, type CandidatRecoupe } from "@/app/actions/arbitrage";
import { LIBELLES_TYPE_TERME, SOURCES_MINIMUM, type TypeTerme } from "@/lib/dictionnaire";
import { lienArbitrage } from "./liens";

function cleDe(c: { cle: string; contexte: string }) {
  return `${c.cle}|${c.contexte}`;
}

interface Props {
  recoupes: CandidatRecoupe[];
  chargement: boolean;
  // Rejoue le chargement du parent : publier retire les candidats de la file,
  // les trois onglets changent donc ensemble.
  onPublie: () => Promise<void>;
}

export function OngletRecoupes({ recoupes, chargement, onPublie }: Props) {
  const [selection, setSelection] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [bilan, setBilan] = useState<BilanLot | null>(null);

  // Le lot par défaut est la sélection complète : c'est le geste courant,
  // décocher reste possible pour écarter un candidat douteux. Se rejoue à
  // chaque rechargement, sinon une sélection survivrait à des candidats qui ne
  // sont plus là.
  useEffect(() => {
    setSelection(recoupes.map(cleDe));
  }, [recoupes]);

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
    if (resultat.reussies > 0) toast.success(`${resultat.reussies} entrée(s) publiée(s)`);
    if (resultat.echecs.length > 0) toast.error(`${resultat.echecs.length} échec(s) — voir le détail`);
    await onPublie();
    setEnCours(false);
  };

  const toutCoche = selection.length === recoupes.length;

  return (
    <div className="space-y-4">
      <Card className="border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Publiables sans arbitrage manuel
          </CardTitle>
          <CardDescription>
            Ces candidats ne sont pas seulement attestés par {SOURCES_MINIMUM} sources : ces sources{" "}
            <strong>écrivent la même forme alsacienne</strong>. C&apos;est le recoupement au sens de
            la règle 2. Quand les sources divergent sur la forme, le candidat reste dans la file
            d&apos;arbitrage — choisir la forme canonique est un arbitrage, pas un traitement de
            masse.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap pt-0">
          <p className="text-sm text-muted-foreground tabular-nums">
            {selection.length} sélectionnée(s) sur {recoupes.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={enCours || recoupes.length === 0}
              onClick={() => setSelection(toutCoche ? [] : recoupes.map(cleDe))}
            >
              {toutCoche ? "Tout décocher" : "Tout cocher"}
            </Button>
            <Button
              disabled={enCours || selection.length === 0}
              onClick={validerLot}
              className="bg-emerald-600 hover:bg-emerald-700 tabular-nums"
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
              Aucun candidat n&apos;a deux sources écrivant la même forme alsacienne. Les candidats
              à sources divergentes sont dans la file d&apos;arbitrage.
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
                  {/* La case fait 16px de côté ; `before:-inset-3` porte la
                      zone cliquable à 40px sans la faire grossir à l'écran.
                      Rien d'interactif ne se trouve à moins de 16px à droite,
                      les cibles ne se chevauchent donc pas. */}
                  <Checkbox
                    checked={selection.includes(k)}
                    onCheckedChange={() => basculer(k)}
                    disabled={enCours}
                    aria-label={`Retenir ${c.francais} dans le lot à publier`}
                    className="mt-1 relative before:absolute before:-inset-3 before:content-['']"
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
                      <Crown className="w-3.5 h-3.5 text-marque-or-sombre shrink-0" />
                      <span className="font-semibold">
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
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 tabular-nums">
                      {c.nb_sources} sources
                    </Badge>
                    <Button asChild variant="ghost" size="icon" className="h-10 w-10">
                      <Link
                        href={lienArbitrage(c.cle, c.contexte)}
                        title="Ouvrir l'écran d'arbitrage complet"
                        aria-label={`Ouvrir l'écran d'arbitrage complet pour ${c.francais}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, BookOpenCheck, Loader2, Search } from "lucide-react";
import { rechercherAction, type ResultatRecherche } from "@/app/actions/recherche";
import { LIBELLES_REGION, LIBELLES_TYPE_TERME, type Region, type TypeTerme } from "@/lib/dictionnaire";

export default function AccueilPage() {
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [aCherche, setACherche] = useState(false);

  // Recherche différée : la frappe ne doit pas déclencher un aller-retour par
  // caractère, et la RPC refuse de toute façon les termes d'un seul caractère.
  useEffect(() => {
    const requete = terme.trim();
    if (requete.length < 2) {
      setResultats([]);
      setACherche(false);
      return;
    }

    setRecherche(true);
    const minuteur = setTimeout(async () => {
      const trouves = await rechercherAction(requete);
      setResultats(trouves);
      setACherche(true);
      setRecherche(false);
    }, 250);

    return () => clearTimeout(minuteur);
  }, [terme]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0"></div>

      <div className="relative z-10 container mx-auto px-6 py-16 max-w-3xl space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Elsass Dico <br />
            <span className="text-indigo-400">Français ⇄ Alsacien</span>
          </h1>
          <p className="text-slate-400">
            Cherchez dans les deux sens. Seules les entrées validées à la main sont publiées.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Un mot en français ou en alsacien…"
            className="h-14 pl-12 pr-12 text-lg bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            autoFocus
          />
          {recherche && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-slate-500" />
          )}
        </div>

        {resultats.length > 0 && (
          <div className="space-y-3">
            {resultats.map((e) => (
              <Link key={e.id} href={`/entree/${e.id}`}>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-indigo-400/50 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{e.francais}</span>
                    {e.contexte && (
                      <Badge variant="outline" className="border-white/20 text-slate-300 font-normal">
                        {e.contexte}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-500">
                      {LIBELLES_TYPE_TERME[e.type as TypeTerme] ?? e.type}
                    </span>
                  </div>
                  <p className="text-lg text-indigo-300 font-medium mt-1">
                    {e.traductions[0]?.alsacien}
                  </p>
                  {e.traductions.length > 1 && (
                    <p className="text-sm text-slate-400 mt-1">
                      aussi : {e.traductions.slice(1).map((t) => t.alsacien).join(" · ")}
                    </p>
                  )}
                  {e.traductions[0]?.region && (
                    <Badge variant="secondary" className="mt-2 bg-white/10 text-slate-300 font-normal">
                      {LIBELLES_REGION[e.traductions[0].region as Region]}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {aCherche && !recherche && resultats.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center space-y-2">
            <p className="text-slate-300">Aucune entrée validée pour « {terme.trim()} ».</p>
            <p className="text-sm text-slate-500">
              Le dictionnaire se construit par recoupement : un mot n&apos;apparaît ici qu&apos;une
              fois attesté puis arbitré. Vous connaissez la traduction ?{" "}
              <Link href="/login" className="text-indigo-400 hover:underline">
                Devenez contributeur
              </Link>
              .
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-left">
          <div className="p-4 rounded-xl border border-white/5 bg-white/5">
            <CheckCircle2 className="w-6 h-6 text-indigo-400 mb-2" />
            <h3 className="font-bold">Recoupement, pas génération</h3>
            <p className="text-sm text-slate-400">
              Aucune entrée n&apos;est retenue si elle n&apos;est attestée que dans une seule source.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/5">
            <BookOpenCheck className="w-6 h-6 text-cyan-400 mb-2" />
            <h3 className="font-bold">Graphie ORTHAL 2023</h3>
            <p className="text-sm text-slate-400">
              Chaque entrée validée est réécrite selon la norme de l&apos;association AGATE.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/login">
            <Button variant="outline" className="border-white/20 bg-transparent hover:bg-white/10">
              Espace contributeur <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

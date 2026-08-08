import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, ShieldCheck } from "lucide-react";
import { chargerEntree } from "@/app/actions/recherche";
import { LIBELLES_REGION, LIBELLES_TYPE_TERME } from "@/lib/dictionnaire";

// Page publique : aucune session requise. chargerEntree() ne renvoie que des
// entrées au statut 'valide', conformément au RLS.
export default async function EntreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entree = await chargerEntree(id);

  if (!entree) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-6 py-12 max-w-2xl space-y-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Recherche
          </Button>
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-black">{entree.francais}</h1>
            {entree.contexte && (
              <Badge variant="outline" className="border-white/20 text-slate-300 font-normal">
                {entree.contexte}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {LIBELLES_TYPE_TERME[entree.type] ?? entree.type}
          </p>
        </div>

        <div className="space-y-3">
          {entree.traductions.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={i === 0 ? "text-2xl font-bold text-indigo-300" : "text-lg text-slate-200"}
                >
                  {t.alsacien}
                </span>
                {i === 0 && (
                  <Badge className="gap-1 bg-amber-500 hover:bg-amber-500">
                    <Crown className="w-3 h-3" /> Forme canonique
                  </Badge>
                )}
                {t.region && (
                  <Badge variant="secondary" className="bg-white/10 text-slate-300 font-normal">
                    {LIBELLES_REGION[t.region]}
                  </Badge>
                )}
                {t.niveau && <span className="text-xs text-slate-500">{t.niveau}</span>}
              </div>
              {t.note && <p className="text-sm text-slate-400">{t.note}</p>}
            </div>
          ))}
        </div>

        {/* La traçabilité est la défense contre l'accusation d'alsacien
            artificiel : on affiche sur quoi l'entrée s'appuie. */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {entree.nb_attestations} attestation{entree.nb_attestations > 1 ? "s" : ""}
          </div>
          {entree.sources.length > 0 ? (
            <ul className="space-y-1 text-sm text-slate-400">
              {entree.sources.map((s) => (
                <li key={s.nom}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-300 hover:underline"
                    >
                      {s.nom}
                    </a>
                  ) : (
                    s.nom
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Sources non publiées.</p>
          )}
        </div>
      </div>
    </div>
  );
}

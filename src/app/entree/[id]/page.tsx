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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-12 max-w-2xl space-y-8">
        <Button asChild variant="ghost" className="h-11 -ml-4 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-1" /> Recherche
          </Link>
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-black text-balance">{entree.francais}</h1>
            {entree.contexte && (
              <Badge variant="outline" className="font-normal">
                {entree.contexte}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {LIBELLES_TYPE_TERME[entree.type] ?? entree.type}
          </p>
        </div>

        <div className="space-y-3">
          {entree.traductions.map((t, i) => (
            /* La forme canonique se distingue par la taille, la graisse et son
               badge, jamais par la couleur seule : « Premier est Roi » doit
               rester lisible pour qui ne perçoit pas la nuance. */
            <div
              key={i}
              className={`rounded-xl border p-4 space-y-2 shadow-sm ${
                i === 0 ? "border-marque-or bg-marque-or/[0.07]" : "bg-card"
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className={i === 0 ? "text-2xl font-bold" : "text-lg"}>
                  {t.alsacien}
                </span>
                {i === 0 && (
                  <Badge className="gap-1 bg-marque-or text-foreground hover:bg-marque-or">
                    <Crown className="w-3 h-3" /> Forme canonique
                  </Badge>
                )}
                {t.region && (
                  <Badge variant="secondary" className="font-normal">
                    {LIBELLES_REGION[t.region]}
                  </Badge>
                )}
                {t.niveau && <span className="text-xs text-muted-foreground">{t.niveau}</span>}
              </div>
              {t.note && <p className="text-sm text-muted-foreground text-pretty">{t.note}</p>}
            </div>
          ))}
        </div>

        {/* La traçabilité est la défense contre l'accusation d'alsacien
            artificiel : on affiche sur quoi l'entrée s'appuie. */}
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-marque-or-sombre" />
            {entree.nb_attestations} attestation{entree.nb_attestations > 1 ? "s" : ""}
          </div>
          {entree.sources.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {entree.sources.map((s) => (
                <li key={s.nom}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block py-1.5 rounded transition-colors underline-offset-4 hover:text-marque-rouge-texte hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <p className="text-sm text-muted-foreground">Sources non publiées.</p>
          )}
        </div>
      </div>
    </div>
  );
}

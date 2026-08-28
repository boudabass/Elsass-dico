import { notFound } from "next/navigation";
import { Crown, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { chargerEntree } from "@/app/actions/recherche";
import { LIBELLES_REGION, LIBELLES_TYPE_TERME } from "@/lib/dictionnaire";
import { RangeeActions } from "./actions-row";

// Écran 2 du handoff mobile : header racine avec chevron retour (l'onglet
// "recherche" reste actif, cf. app-header.tsx) plutôt qu'un header empilé —
// fidèle au mockup, qui garde les 3 icônes de nav visibles sur cet écran.
//
// Page publique : aucune session requise. chargerEntree() ne renvoie que des
// entrées au statut 'valide', conformément au RLS.
export default async function EntreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entree = await chargerEntree(id);

  if (!entree) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant="root" actif="recherche" backHref="/" />

      <main className="flex-1 px-4 pt-[18px] pb-8">
        <h1 className="text-[32px] font-extrabold leading-[1.1] text-foreground">{entree.francais}</h1>
        <p className="mt-0.5 text-sm text-neutre-400">
          {entree.contexte || (LIBELLES_TYPE_TERME[entree.type] ?? entree.type)}
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          {/* La forme canonique se distingue par la taille, la graisse et son
              badge, jamais par la couleur seule : « Premier est Roi » doit
              rester lisible pour qui ne perçoit pas la nuance. */}
          {entree.traductions.map((t, i) => (
            <div
              key={i}
              className={
                i === 0
                  ? "rounded-lg border border-marque-or-500 bg-marque-or/[0.07] p-3.5"
                  : "rounded-lg border border-border bg-card p-3.5"
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={i === 0 ? "text-xl font-bold text-foreground" : "text-[17px] font-semibold text-foreground"}>
                  {t.alsacien}
                </span>
                {i === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-marque-or-500 px-2.5 py-0.5 text-xs font-bold text-foreground">
                    <Crown className="h-[11px] w-[11px]" /> Canonique
                  </span>
                )}
                {t.region && t.region !== "commun" && (
                  <span className="text-xs text-neutre-400">
                    {LIBELLES_REGION[t.region]}
                  </span>
                )}
                {t.niveau && <span className="text-xs text-neutre-400">{t.niveau}</span>}
              </div>
              {t.note && <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>}
            </div>
          ))}
        </div>

        {/* La traçabilité est la défense contre l'accusation d'alsacien
            artificiel : on affiche sur quoi l'entrée s'appuie. */}
        <div className="mt-[18px] rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-marque-or-700" />
            {entree.nb_attestations} attestation{entree.nb_attestations > 1 ? "s" : ""}
          </div>
          {entree.sources.length > 0 ? (
            <ul className="mt-2.5 flex flex-col gap-1.5 text-sm">
              {entree.sources.map((s) => (
                <li key={s.nom}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded py-0.5 underline-offset-4 transition-colors hover:text-marque-rouge-texte hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {s.nom}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{s.nom}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 text-sm text-muted-foreground">Sources non publiées.</p>
          )}
        </div>

        <RangeeActions entreeId={entree.id} formeCanonique={entree.traductions[0]?.alsacien ?? ""} />
      </main>
    </div>
  );
}

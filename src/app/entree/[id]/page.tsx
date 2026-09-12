import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BadgeConfiance } from "@/components/badge-confiance";
import { chargerLemme } from "@/app/actions/recherche";
import { LIBELLES_TYPE_TERME } from "@/lib/dictionnaire";
import { RangeeActions } from "./actions-row";

// Écran 2 du handoff mobile : header racine avec chevron retour (l'onglet
// « recherche » reste actif, cf. app-header.tsx) plutôt qu'un header empilé —
// fidèle au mockup, qui garde les icônes de nav visibles sur cet écran.
//
// Refondu le 12/09/2026. Ce qui disparaît, et qui n'était pas décoratif : la
// COURONNE « Canonique ». Il n'y a plus de forme canonique — « Premier est Roi »
// et l'index 0 du tableau `traductions` ont été abandonnés le 11/09. Toutes les
// variantes coexistent, et l'ordre d'affichage ne dit rien d'autre que « celle-ci
// a le plus de témoins ». Distinguer visuellement la première reviendrait à
// réintroduire l'arbitrage dans la mise en page.
//
// Ce qui apparaît à la place : pour chaque forme, SES témoins — les sources
// écrites qui l'écrivent et les villages qui la revendiquent, dans deux blocs
// distincts. La traçabilité descend de l'entrée à la forme, ce qui était le
// défaut structurel trouvé en production le 08/09 : le badge d'une entrée
// annonçait « 2 sources » devant une forme qu'une seule écrivait.
export default async function EntreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lemme = await chargerLemme(id);

  if (!lemme) notFound();

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader variant="root" actif="recherche" backHref />

      <main className="flex-1 px-4 pt-[18px] pb-8">
        <h1 className="text-[32px] font-extrabold leading-[1.1] text-foreground">
          {lemme.francais}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutre-400">
          <span>{lemme.contexte || (LIBELLES_TYPE_TERME[lemme.type] ?? lemme.type)}</span>
          {lemme.commune && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              {lemme.commune.departement === "67"
                ? "Bas-Rhin"
                : lemme.commune.departement === "68"
                  ? "Haut-Rhin"
                  : "Moselle"}
            </span>
          )}
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutre-400">
          {lemme.variantes.length} forme{lemme.variantes.length > 1 ? "s" : ""} attestée
          {lemme.variantes.length > 1 ? "s" : ""}
        </p>

        <div className="mt-2.5 flex flex-col gap-2.5">
          {lemme.variantes.map((v) => (
            <div key={v.id} className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold text-foreground">{v.forme}</span>
                <BadgeConfiance nbSources={v.nbSources} nbVillages={v.nbVillages} />
              </div>

              {/* L'article défini est une colonne DÉRIVÉE : `article` +
                  `formeSansArticle` redonne `forme` octet à octet (migration
                  20260903010000). Rien n'est réécrit, on annote. */}
              {v.article && (
                <p className="mt-1 text-xs text-neutre-400">
                  article : <span className="font-semibold">{v.article.trim()}</span>
                </p>
              )}

              {/* Deux blocs séparés, et ils ne se totalisent jamais. Une source
                  écrite n'est pas un village, un village n'est pas une source. */}
              {v.sources.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-neutre-400">Sources écrites</p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {v.sources.map((s) => (
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
                </div>
              )}

              {v.villages.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-neutre-400">
                    Villages qui disent cette forme
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {v.villages.map((c) => c.nom).join(" · ")}
                  </p>
                </div>
              )}

              {/* La dette de données se dit, elle ne se cache pas : c'est elle
                  qui appelle la contribution (doc 20). */}
              {v.villages.length === 0 && (
                <p className="mt-2.5 text-sm text-neutre-400">
                  Personne n&apos;a encore dit d&apos;où vient cette forme.
                </p>
              )}
            </div>
          ))}
        </div>

        <RangeeActions entreeId={lemme.id} premiereForme={lemme.variantes[0]?.forme ?? ""} />
      </main>
    </div>
  );
}

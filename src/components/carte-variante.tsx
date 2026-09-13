import { BadgeConfiance } from "@/components/badge-confiance";
import type { VarianteDetaillee } from "@/lib/dictionnaire";

// Extrait de /entree/[id] le 13/09/2026 pour être réutilisé tel quel par les
// fiches publiques /village/[slug] et /prenom/[slug] : trois écrans affichent
// désormais la même carte de variante, ce qui justifie l'extraction (elle ne
// l'était pas pour un seul écran).
//
// Deux blocs séparés, qui ne se totalisent jamais : une source écrite n'est
// pas un village, un village n'est pas une source (erreur de la PR #41,
// trouvée en production le 09/09/2026).
export function CarteVariante({ variante: v }: { variante: VarianteDetaillee }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
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

      {v.villages.length === 0 && (
        <p className="mt-2.5 text-sm text-neutre-400">
          Personne n&apos;a encore dit d&apos;où vient cette forme.
        </p>
      )}
    </div>
  );
}

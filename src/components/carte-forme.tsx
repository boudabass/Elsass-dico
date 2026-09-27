import { BadgeConfiance } from "@/components/badge-confiance";
import { precisionLemme, type FormeResume } from "@/lib/dictionnaire";

// Une forme alsacienne dans une liste, côté alsacien → français (27/09/2026) :
// la forme en titre, puis ce qu'elle veut dire. Chaque sens porte le badge de
// SA variante — le couple forme × sens est une variante, c'est elle qui a des
// sources et des villages. Jamais un badge pour la forme entière : il
// additionnerait des témoins qui ne parlent pas de la même chose.
export function CarteForme({ forme }: { forme: FormeResume }) {
  const autres = forme.nbSens - forme.sens.length;
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="text-lg font-bold text-sens-texte">{forme.titre}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">
        Veut dire&nbsp;:
      </p>
      <ul className="mt-1 space-y-1">
        {forme.sens.map((s) => (
          <li key={s.lemmeId} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold text-foreground">{s.francais}</span>
            {precisionLemme(s) && <span className="text-xs text-muted-foreground">{precisionLemme(s)}</span>}
            {/* La graphie exacte quand elle diffère du titre (`d'r Lohn`
                sous `Lohn`) : on ne montre pas une forme que la source
                n'a pas écrite telle quelle. */}
            {s.forme !== forme.titre && <span className="text-sm text-muted-foreground">({s.forme})</span>}
            <BadgeConfiance nbSources={s.nbSources} nbVillages={s.nbVillages} />
          </li>
        ))}
      </ul>
      {autres > 0 && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          et {autres} autre{autres > 1 ? "s" : ""} sens
        </p>
      )}
    </div>
  );
}

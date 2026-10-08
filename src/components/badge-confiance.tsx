import { niveauConfiance, LIBELLES_NIVEAU_CONFIANCE, type NiveauConfiance } from "@/lib/dictionnaire";

// Ce qui fonde une forme, affiché à côté d'elle. Trois niveaux pour les sources
// écrites (décision de John, 02/09/2026), révisée le 28/09/2026 : 1 = gris,
// 2 = jaune, 3+ = vert. La plupart des formes n'ont qu'une source ; en rouge
// d'alerte, elles couvraient l'écran de pastilles qui disaient « douteux »,
// l'inverse de « peu attesté est publiable », et ce rouge se confondait avec
// celui de l'alsacien. Le badge ne se contente jamais de la couleur (le texte
// porte le compte) pour rester lisible hors contexte et pour qui ne perçoit pas
// la teinte.
//
// DEUX PASTILLES, JAMAIS UNE. Depuis la refonte du 11/09/2026, une forme peut
// être portée par des sources écrites, par des villages, ou par les deux. Les
// additionner dans un seul chiffre est exactement le bug de la PR #41, trouvé en
// production le 09/09 : « 3 sources retenues » quatre lignes au-dessus de
// « 2 sources indépendantes ». Un village n'est pas une source bibliographique,
// et une source ne parle depuis aucun village.
//
// Styles réutilisés du vocabulaire de pastille succès/attention de l'app.
// Texte des trois niveaux à 4,5:1 au moins sur son fond (mesuré le 28/09/2026).
const STYLES: Record<NiveauConfiance, string> = {
  une: "bg-neutre-100 text-neutre-600",
  deux: "bg-attention-100 text-attention-500",
  plusieurs: "bg-succes-100 text-succes-500",
};

const PASTILLE = "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function BadgeConfiance({
  nbSources,
  nbVillages = 0,
  className = "",
}: {
  nbSources: number;
  nbVillages?: number;
  className?: string;
}) {
  const niveau = niveauConfiance(nbSources);

  return (
    <span className={`inline-flex shrink-0 flex-wrap items-center gap-1.5 ${className}`}>
      {nbSources > 0 && (
        <span title={LIBELLES_NIVEAU_CONFIANCE[niveau]} className={`${PASTILLE} ${STYLES[niveau]}`}>
          {nbSources} source{nbSources > 1 ? "s" : ""}
        </span>
      )}
      {nbVillages > 0 && (
        <span
          title={`Dit dans ${nbVillages} village${nbVillages > 1 ? "s" : ""}`}
          className={`${PASTILLE} bg-marque-or-50 text-marque-or-700`}
        >
          {nbVillages} village{nbVillages > 1 ? "s" : ""}
        </span>
      )}
      {/* Ni source ni village : ça ne devrait pas exister — une variante naît
          toujours d'un témoignage. Le dire plutôt que de n'afficher rien, sinon
          la forme apparaîtrait comme si elle se fondait d'elle-même. */}
      {nbSources === 0 && nbVillages === 0 && (
        <span className={`${PASTILLE} bg-neutre-100 text-neutre-600`}>0 source, 0 village</span>
      )}
    </span>
  );
}

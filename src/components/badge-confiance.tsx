import { niveauConfiance, LIBELLES_NIVEAU_CONFIANCE, type NiveauConfiance } from "@/lib/dictionnaire";

// Modèle de confiance à trois niveaux (décision de John, 02/09/2026,
// CLAUDE.md règle 2) : 1 source = rouge, 2 = jaune, 3+ = vert. Le badge ne
// se contente jamais de la couleur seule — le texte porte "N source(s)" —
// pour rester lisible hors contexte (résultats de recherche, liste A-Z) et
// pour qui ne perçoit pas la teinte.
//
// Styles réutilisés de dashboard.tsx (bg-X-100 text-X-500), déjà le
// vocabulaire de pastille "succès/attention" de cette app. --destructive/10
// remplace le rouge : aucun token danger-100 n'existe encore, et --destructive
// est déjà le rouge d'alerte vérifié en accessibilité ailleurs dans l'app
// (form.tsx, alert.tsx) — distinct du rouge de marque, réservé aux CTA.
const STYLES: Record<NiveauConfiance, string> = {
  rouge: "bg-destructive/10 text-destructive",
  jaune: "bg-attention-100 text-attention-500",
  vert: "bg-succes-100 text-succes-500",
};

export function BadgeConfiance({ nbSources, className = "" }: { nbSources: number; className?: string }) {
  const niveau = niveauConfiance(nbSources);
  return (
    <span
      title={LIBELLES_NIVEAU_CONFIANCE[niveau]}
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[niveau]} ${className}`}
    >
      {nbSources} source{nbSources > 1 ? "s" : ""}
    </span>
  );
}

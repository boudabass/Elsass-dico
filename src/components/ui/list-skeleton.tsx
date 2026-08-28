import { Skeleton } from "@/components/ui/skeleton";

// Écran 13 du handoff mobile : pattern de chargement générique pour tout
// écran à liste (recherche, A-Z, mes contributions) — 5 lignes titre+sous-
// titre. Largeurs légèrement variées ligne à ligne pour éviter l'alignement
// parfait qui trahirait un placeholder statique, comme le mockup.
const LARGEURS: [string, string][] = [
  ["55%", "35%"],
  ["62%", "30%"],
  ["48%", "40%"],
  ["58%", "33%"],
  ["50%", "38%"],
];

export function ListSkeleton({ lignes = 5 }: { lignes?: number }) {
  return (
    <div role="status" aria-label="Chargement" className="flex flex-col">
      {LARGEURS.slice(0, lignes).map(([titre, sousTitre], i) => (
        <div
          key={i}
          className={
            i < lignes - 1
              ? "flex flex-col gap-1.5 border-b border-border py-3"
              : "flex flex-col gap-1.5 py-3"
          }
        >
          <Skeleton className="h-[15px] bg-neutre-100" style={{ width: titre }} />
          <Skeleton className="h-[11px] bg-neutre-100" style={{ width: sousTitre }} />
        </div>
      ))}
    </div>
  );
}

import { Map as IconeCarte } from "lucide-react";
import Link from "next/link";

// « Voir sur la carte » depuis la fiche d'un mot ou d'une forme (revue du
// 28/09/2026). La carte est l'écran central, mais aucune fiche n'y menait :
// il fallait retenir le mot, changer d'onglet et le retaper.
export function LienCarte({ href }: { href: string }) {
  // `retour=1` : la carte sait qu'elle vient d'une fiche (voir carte-demo).
  const cible = `${href}${href.includes("?") ? "&" : "?"}retour=1`;
  return (
    <Link
      href={cible}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sens-200 bg-sens-50 px-3.5 text-sm font-semibold text-sens-texte transition-colors hover:bg-sens-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <IconeCarte className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Voir sur la carte
    </Link>
  );
}

import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

// L'habillage des pages lisibles sans compte (village, prénom, sources) :
// pas de rail de navigation, un chevron vers la home. `backHref` fixe plutôt
// que l'historique : on y arrive aussi bien depuis la home que depuis Google
// ou un lien partagé, sans historique interne où revenir.
export function FichePublique({
  titre,
  className,
  children,
}: {
  titre: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant="stack" titre={titre} backHref="/" />
      <main className={cn("mx-auto w-full max-w-3xl flex-1 p-4 pb-8", className)}>{children}</main>
    </div>
  );
}

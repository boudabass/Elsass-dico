import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { URL_INSCRIPTION_ODOO } from "@/lib/odoo";
import { cn } from "@/lib/utils";

// L'habillage des pages lisibles sans compte (village, prénom, sources) :
// pas de rail de navigation, un chevron vers la home. Lien fixe plutôt que
// l'historique : on y arrive aussi bien depuis la home que depuis Google ou un
// lien partagé, sans historique interne où revenir.
//
// Le nom du site plutôt que le titre de la page dans l'en-tête (revue du
// 28/09/2026) : ces fiches sont la porte d'entrée depuis Google, et le visiteur
// qui y tombait ne voyait nulle part sur quel site il était. Le titre de la page
// reste dans son <h1>, il n'était que répété dans l'en-tête.
export function FichePublique({
  className,
  children,
  retour,
}: {
  className?: string;
  children: ReactNode;
  // Où mène la flèche, quand la fiche n'a pas l'accueil pour origine (le défi
  // du jour). Absent : la flèche va à l'accueil, comme avant.
  retour?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-ecran flex-col">
      <header
        className="sticky top-[var(--hauteur-inverseur)] z-40 border-b border-border bg-background"
        style={{ paddingTop: "var(--marge-encoche-entete)" }}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <Link
            href={retour?.href ?? "/"}
            aria-label={retour?.label ?? "Retour à l'accueil"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutre-100 text-foreground transition-colors hover:bg-neutre-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </Link>
          <Link
            href="/"
            className="rounded-md px-1 font-display text-xl text-marque-rouge-texte focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Elsass Dico
          </Link>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-3xl flex-1 p-4 pb-8", className)}>{children}</main>
    </div>
  );
}

// Ce qu'un visiteur arrivé sur une fiche peut faire ensuite. Avant la revue du
// 28/09/2026, la fiche de Colmar s'arrêtait sur ses deux formes : rien ne disait
// ce qu'est le site, rien ne menait au défi ni à un compte.
export function InvitationPublique() {
  return (
    <section className="rounded-2xl bg-neutre-50 p-5 sm:p-6">
      <h2 className="text-balance font-display text-[22px] leading-tight text-foreground">
        Et chez toi, comment on le dit&nbsp;?
      </h2>
      <p className="mt-2 max-w-prose text-[15px] text-muted-foreground">
        Elsass Dico garde toutes les façons de dire l&apos;alsacien, village par village. Rien
        n&apos;est inventé&nbsp;: chaque mot vient d&apos;un dictionnaire ou d&apos;un Alsacien qui
        le parle. Avec un compte, tu ajoutes le parler de ton village.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/jeu"
          className="flex h-12 items-center justify-center rounded-lg bg-marque-rouge-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-1"
        >
          Jouer le défi du jour
        </Link>
        <a
          href={URL_INSCRIPTION_ODOO}
          className="flex h-12 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-1"
        >
          Créer mon compte
        </a>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Déjà un compte&nbsp;?{" "}
        <Link
          href="/login"
          className="inline-block py-1.5 font-semibold text-foreground underline underline-offset-4 hover:text-marque-rouge-texte"
        >
          Me connecter
        </Link>
      </p>
    </section>
  );
}

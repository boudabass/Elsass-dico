import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionActuelle } from "@/lib/session-serveur";
import { URL_INSCRIPTION_ODOO } from "@/lib/odoo";

// Présentation publique, sans compte (doc 20, étape 3 — 13/09/2026). Remplace
// l'ancien `/` (l'écran de recherche, déplacé vers `/recherche`) : le compte
// reste obligatoire pour tout le reste de l'app, mais un visiteur qui arrive
// depuis Google sur `/village/[slug]` ou `/prenom/[slug]` doit pouvoir
// atterrir ici et comprendre ce qu'est le site avant qu'on lui demande de se
// connecter — un `/login` sans contexte serait un cul-de-sac.
//
// Un membre déjà connecté n'a rien à faire d'un argumentaire : redirection
// serveur directe vers la recherche.
export default async function AccueilPubliquePage() {
  const session = await sessionActuelle();
  if (session) redirect("/recherche");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <p className="font-display text-[32px] text-marque-rouge-texte">Elsass Dico</p>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Dictionnaire français-alsacien construit par recoupement de sources
        indépendantes, en graphie ORTHAL. Chaque forme vient de ses témoins —
        une source écrite ou un locuteur qui dit d&apos;où vient son parler —
        jamais inventée.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-lg bg-marque-rouge-500 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600"
        >
          Se connecter
        </Link>
        <a
          href={URL_INSCRIPTION_ODOO}
          className="flex h-12 w-full items-center justify-center rounded-lg border border-bordure-forte text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
        >
          Créer un compte
        </a>
      </div>

      <p className="mt-10 text-xs text-neutre-400">
        <Link href="/sources" className="underline">
          Sources et licences
        </Link>
      </p>
    </main>
  );
}

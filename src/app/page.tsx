import Link from "next/link";
import { redirect } from "next/navigation";
import { motsVitrineAction } from "@/app/actions/accueil";
import { RechercheAccueil } from "@/app/recherche-accueil";
import { BadgeConfiance } from "@/components/badge-confiance";
import { sessionActuelle } from "@/lib/session-serveur";
import { URL_INSCRIPTION_ODOO } from "@/lib/odoo";

// Présentation publique, sans compte (doc 20, étape 3 — 13/09/2026). Remplace
// l'ancien `/` (l'écran de recherche, déplacé vers `/recherche`) : le compte
// reste obligatoire pour tout le reste de l'app, mais un visiteur qui arrive
// depuis Google sur `/village/[slug]` ou `/prenom/[slug]` doit pouvoir
// atterrir ici et comprendre ce qu'est le site avant qu'on lui demande de se
// connecter — un `/login` sans contexte serait un cul-de-sac.
//
// Révisée le 18/09/2026 (retour de John) : la page ne montrait jusque-là
// qu'un argumentaire et deux boutons — jamais un seul mot alsacien. Deux
// ajouts, choisis pour rester dans la doctrine « compte obligatoire » du
// doc 20 : une vitrine de mots de base (données réelles, jamais inventées) et
// une recherche restreinte aux deux collections déjà publiques sans compte
// (village, prénom) — jamais le dictionnaire entier, qui reste derrière
// `/recherche`.
//
// Un membre déjà connecté n'a rien à faire d'un argumentaire : redirection
// serveur directe vers la recherche.
export default async function AccueilPubliquePage() {
  const session = await sessionActuelle();
  if (session) redirect("/recherche");

  const vitrine = await motsVitrineAction();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-12 text-center">
      <p className="font-display text-[32px] text-marque-rouge-texte">Elsass Dico</p>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Dictionnaire français-alsacien construit par recoupement de sources
        indépendantes, en graphie ORTHAL. Chaque forme vient de ses témoins —
        une source écrite ou un locuteur qui dit d&apos;où vient son parler —
        jamais inventée.
      </p>

      <div className="mt-6">
        <RechercheAccueil />
      </div>

      {vitrine.length > 0 && (
        <section className="mt-10 w-full">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutre-400">
            Quelques mots, pour voir
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {vitrine.map((mot) => (
              <div key={mot.id} className="rounded-lg border border-border bg-card p-3 text-left">
                <p className="text-xs font-semibold text-neutre-400">{mot.francais}</p>
                <ul className="mt-1 space-y-1">
                  {mot.formes.map((f) => (
                    <li key={f.forme} className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">{f.forme}</span>
                      <BadgeConfiance nbSources={f.nbSources} nbVillages={f.nbVillages} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
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

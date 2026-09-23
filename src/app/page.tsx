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
// Reprise le 18/09/2026 (retour de John, deux points) :
//   1. Le pitch vendait la graphie ORTHAL comme argument de premier plan.
//      Périmé depuis la refonte du 11/09 (« ORTHAL devient secondaire comme
//      arbitre ») : ce que le produit vend maintenant, c'est qu'aucune forme
//      n'a besoin d'être « la bonne » — chaque village garde la sienne. Le
//      pitch dit ça, pas une norme de graphie que personne ne vient chercher.
//   2. « Se connecter » et « Créer un compte » en deux gros boutons pleine
//      largeur, empilés juste sous la vitrine, créaient une seule masse de
//      poids égal — Odoo étant l'unique guichet d'inscription, c'est LUI
//      l'action qu'on veut qu'un nouveau visiteur prenne. Reconstruit en
//      hiérarchie Persuade classique : « Créer un compte » est le seul bouton
//      plein de la page, « Se connecter » redescend en lien discret dans la
//      barre du haut, pour qui revient déjà équipé d'un compte.
export default async function AccueilPubliquePage() {
  const session = await sessionActuelle();
  if (session) redirect("/recherche");

  const vitrine = await motsVitrineAction();

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-xl text-marque-rouge-texte">Elsass Dico</span>
        <Link
          href="/login"
          className="rounded-md px-2 py-1 text-sm font-semibold text-foreground underline-offset-4 transition-colors hover:text-marque-rouge-texte hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Se connecter
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-20 pt-6 text-center sm:pt-12">
        <h1 className="text-balance font-display text-[34px] leading-[1.15] text-foreground sm:text-[46px]">
          Le français-alsacien,{" "}
          <span className="text-marque-rouge-texte">village par village</span>.
        </h1>
        <p className="mt-4 max-w-md text-balance text-base text-muted-foreground">
          Tiré de sources écrites et des Alsaciens qui le parlent. Jamais une
          traduction inventée. Chaque forme dit qui l&apos;atteste,
          sans en effacer aucune.
        </p>

        <a
          href={URL_INSCRIPTION_ODOO}
          className="mt-7 flex h-12 items-center justify-center rounded-lg bg-marque-rouge-500 px-8 text-sm font-semibold text-white shadow-sm shadow-marque-rouge-500/20 transition-all hover:-translate-y-0.5 hover:bg-marque-rouge-600 hover:shadow-md hover:shadow-marque-rouge-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Créer un compte
        </a>

        <section className="mt-14 w-full rounded-2xl border border-border bg-neutre-50 p-6 sm:p-8">
          <h2 className="text-base font-bold text-foreground">
            Un village, un prénom, pour commencer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cherche une commune ou un prénom : c&apos;est déjà dans le dico.
          </p>
          <div className="mt-4 flex justify-center">
            <RechercheAccueil />
          </div>
        </section>

        {vitrine.length > 0 && (
          <section className="mt-8 w-full">
            <h2 className="text-base font-bold text-foreground">Quelques mots, pour voir</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {vitrine.map((mot) => (
                <div
                  key={mot.id}
                  className="rounded-xl border border-border bg-card p-3 text-left"
                >
                  <p className="text-xs font-semibold text-muted-foreground">{mot.francais}</p>
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

        <p className="mt-14 text-xs text-muted-foreground">
          <Link href="/sources" className="underline underline-offset-2">
            Sources et licences
          </Link>
        </p>
      </main>
    </div>
  );
}

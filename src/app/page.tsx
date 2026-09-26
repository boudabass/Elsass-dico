import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { motsVitrineAction } from "@/app/actions/accueil";
import { RechercheAccueil } from "@/app/recherche-accueil";
import { BadgeConfiance } from "@/components/badge-confiance";
import { chargerApercuAccueil, type ApercuCarte } from "@/lib/apercu-accueil";
import { jourActuel, mancheOuverteDuJour, NB_MANCHES, numeroDefi } from "@/lib/jeu";
import { sessionActuelle } from "@/lib/session-serveur";
import { URL_INSCRIPTION_ODOO } from "@/lib/odoo";

// Présentation publique, sans compte (doc 20, étape 3 — 13/09/2026). Un
// visiteur qui arrive depuis Google ou un post du défi doit comprendre ce
// qu'est le site avant qu'on lui demande un compte.
//
// Reprise le 18/09/2026 : le pitch ne vend plus la graphie ORTHAL mais ce que
// le produit est devenu (chaque village garde sa forme).
//
// Refonte le 26/09/2026 (retour de John : « on ne comprend pas qu'il y a
// encore tout le dico, la recherche, la carte, le jeu ») :
//   - DEUX PORTES DE MÊME POIDS, décision de John : le défi du jour, qui se
//     joue sans compte, et la participation au dictionnaire. Le défi montre sa
//     vraie manche 1, sans la réponse : la même que publie la route
//     d'automatisation.
//   - « Avec ton compte » montre l'app avec de VRAIES données : la carte des
//     villages dessinée depuis notre fond, les chiffres comptés en base, un mot
//     avec toutes ses formes. Ces aperçus ne sont pas des liens : un clic qui
//     tombe sur /login sans prévenir est le défaut que cette page corrige.
export default async function AccueilPubliquePage() {
  const session = await sessionActuelle();
  if (session) redirect("/recherche");

  const jour = jourActuel();
  const [vitrine, apercu, manche] = await Promise.all([
    motsVitrineAction(),
    chargerApercuAccueil(),
    mancheOuverteDuJour(jour),
  ]);
  const numero = numeroDefi(jour);
  // fr-FR sépare les milliers par une espace fine insécable (U+202F), que la
  // police de l'app ne dessine pas : « 41646 » à l'écran. Espace insécable
  // ordinaire à la place.
  const nombre = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
  // Le mot de l'aperçu du dictionnaire n'est pas répété dans la vitrine.
  const motsVitrine = vitrine.filter((m) => m.id !== apercu.exemple?.id);

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-xl text-marque-rouge-texte">Elsass Dico</span>
        <Link
          href="/login"
          className="rounded-md px-2 py-1 text-sm font-semibold text-foreground underline-offset-4 transition-colors hover:text-marque-rouge-texte hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Se connecter
        </Link>
      </header>

      <main className="pb-20">
        {/* Ouverture : le propos, puis les deux portes. */}
        <section className="mx-auto w-full max-w-5xl px-6 pt-4 sm:px-10 sm:pt-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance font-display text-[34px] leading-[1.15] text-foreground sm:text-[46px]">
              Le français-alsacien,{" "}
              <span className="text-marque-rouge-texte">village par village</span>.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-balance text-base text-muted-foreground">
              Tiré de sources écrites et des Alsaciens qui le parlent. Jamais une
              traduction inventée. Chaque forme dit qui l&apos;atteste,
              sans en effacer aucune.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Link
              href="/jeu"
              className="group flex flex-col rounded-2xl bg-marque-rouge-500 p-6 text-white shadow-md shadow-marque-rouge-900/15 transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-marque-rouge-600 hover:shadow-lg hover:shadow-marque-rouge-900/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-7"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[26px] leading-tight">Défi du jour</span>
                <span className="text-sm font-semibold tabular-nums text-white/80">n° {numero}</span>
              </span>
              <span className="mt-1 text-sm text-white/85">
                Sans compte · {NB_MANCHES} manches
              </span>

              {manche ? (
                <span className="mt-6 block">
                  <span className="sr-only">Quel village dit : </span>
                  <span
                    lang="gsw"
                    className="block text-balance break-words font-display text-[30px] leading-[1.12] sm:text-[34px]"
                  >
                    {manche.formes.map((f, i) => (
                      <span key={f}>
                        {i > 0 && <span className="text-white/50"> · </span>}
                        {f}
                      </span>
                    ))}
                  </span>
                  <span aria-hidden className="mt-2 block text-[15px] font-semibold text-white/85">
                    Quel village dit ça ?
                  </span>
                  <span className="mt-4 flex flex-wrap gap-2">
                    {manche.choix.map((c) => (
                      <span
                        key={c.nom}
                        className="rounded-full border border-white/35 px-3 py-1 text-sm font-medium"
                      >
                        {c.nom}
                      </span>
                    ))}
                  </span>
                </span>
              ) : (
                <span className="mt-6 block text-[15px] text-white/85">
                  Des formes alsaciennes, quatre villages : retrouve celui qui les dit.
                </span>
              )}

              <span className="mt-auto flex items-center gap-2 pt-7 text-base font-semibold">
                Jouer
                <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>

            <a
              href={URL_INSCRIPTION_ODOO}
              className="group flex flex-col rounded-2xl bg-foreground p-6 text-background shadow-md shadow-black/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-7"
            >
              <span className="font-display text-[26px] leading-tight">Participer au dictionnaire</span>
              <span className="mt-1 text-sm text-background/75">
                Compte gratuit, sur le portail The Elsassisch
              </span>

              <span className="mt-6 block">
                <span className="block font-display text-[30px] leading-[1.12] sm:text-[34px]">
                  {nombre(apercu.nbMots)} mots
                </span>
                <span className="mt-2 block text-[15px] text-background/80">
                  {nombre(apercu.nbFormes)} formes alsaciennes à chercher, à situer sur la
                  carte, et à compléter avec celles de ton village.
                </span>
              </span>

              <span className="mt-auto flex items-center gap-2 pt-7 text-base font-semibold">
                Créer mon compte
                <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </a>
          </div>
        </section>

        {/* Sans compte : les fiches publiques. */}
        <section className="mx-auto mt-16 w-full max-w-2xl px-6 text-center sm:px-10">
          <h2 className="text-lg font-bold text-foreground">Un village, un prénom, sans compte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque commune et chaque prénom attestés ont leur fiche, ouverte à tous.
          </p>
          <div className="mt-4 flex justify-center">
            <RechercheAccueil />
          </div>
        </section>

        {/* Avec ton compte : l'app, montrée avec ses vraies données. */}
        <section className="mt-20 border-y border-border bg-neutre-50 py-14 sm:py-16">
          <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
            <div className="max-w-2xl">
              <h2 className="text-balance font-display text-[28px] leading-tight text-foreground sm:text-[34px]">
                Avec ton compte, tout le dico
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                La carte, le dictionnaire complet et la recherche s&apos;ouvrent aux
                membres. Voici ce qui t&apos;attend, tiré de la base telle
                qu&apos;elle est aujourd&apos;hui.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
              <figure>
                <div className="rounded-2xl border border-border bg-background p-4 sm:p-6">
                  <CarteApercu carte={apercu.carte} />
                </div>
                <figcaption className="mt-4">
                  <span className="block text-lg font-bold text-foreground">La carte des parlers</span>
                  <span className="mt-1 block text-[15px] text-muted-foreground">
                    Chaque point est l&apos;un des {nombre(apercu.carte.nbVillages)} villages
                    qui disent leur nom en alsacien, en {nombre(apercu.carte.nbFormes)} formes.
                    Avec ton compte, cherche n&apos;importe quel mot et vois où chacune de
                    ses formes se dit.
                  </span>
                </figcaption>
              </figure>

              <div className="flex flex-col gap-10">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Le dictionnaire, {nombre(apercu.nbMots)} mots
                  </h3>
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    Recherche un mot ou parcours-le de A à Z. Chaque mot montre toutes ses
                    formes et ce qui fonde chacune. Aucune n&apos;est déclarée la bonne.
                  </p>
                  {apercu.exemple && (
                    <div className="mt-5 rounded-2xl border border-border bg-background p-5">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {apercu.exemple.francais}
                      </p>
                      <ul className="mt-3 divide-y divide-border">
                        {apercu.exemple.formes.map((f) => (
                          <li
                            key={f.forme}
                            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2.5 first:pt-0 last:pb-0"
                          >
                            <span lang="gsw" className="font-display text-xl text-foreground">
                              {f.forme}
                            </span>
                            <BadgeConfiance nbSources={f.nbSources} nbVillages={f.nbVillages} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">Ton parler, sur la carte</h3>
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    Choisis ton village. Rattache-le aux formes que tu dis déjà, ou ajoute
                    celle qu&apos;on emploie chez toi. Tout membre contribue, qu&apos;il
                    découvre l&apos;alsacien ou le parle depuis toujours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {motsVitrine.length > 0 && (
          <section className="mx-auto mt-16 w-full max-w-2xl px-6 sm:px-10">
            <h2 className="text-center text-lg font-bold text-foreground">Quelques mots, pour voir</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {motsVitrine.map((mot) => (
                <div
                  key={mot.id}
                  className="rounded-xl border border-border bg-card p-3 text-left"
                >
                  <p className="text-xs font-semibold text-muted-foreground">{mot.francais}</p>
                  <ul className="mt-1 space-y-1">
                    {mot.formes.map((f) => (
                      <li key={f.forme} className="flex flex-wrap items-center gap-1.5">
                        <span lang="gsw" className="text-sm font-bold text-foreground">{f.forme}</span>
                        <BadgeConfiance nbSources={f.nbSources} nbVillages={f.nbVillages} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Les deux portes, reprises en bas pour qui a lu jusqu'ici. */}
        <section className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-3 px-6 sm:flex-row sm:px-10">
          <Link
            href="/jeu"
            className="flex h-12 flex-1 items-center justify-center rounded-lg bg-marque-rouge-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Jouer le défi du jour
          </Link>
          <a
            href={URL_INSCRIPTION_ODOO}
            className="flex h-12 flex-1 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Créer mon compte
          </a>
        </section>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          <Link href="/sources" className="underline underline-offset-2">
            Sources et licences
          </Link>
        </p>
      </main>
    </div>
  );
}

/** La carte des villages, en image : aucun script, aucune requête. */
function CarteApercu({ carte }: { carte: ApercuCarte }) {
  return (
    <svg
      viewBox={`0 0 ${carte.largeur} ${carte.hauteur}`}
      role="img"
      aria-label={`Carte de l'Alsace et de la Moselle, avec un point pour chacun des ${carte.nbVillages} villages qui ont une forme alsacienne attestée.`}
      className="mx-auto block h-auto max-h-[560px] w-full"
    >
      <path d={carte.terre} className="fill-neutre-100 stroke-neutre-300" strokeWidth={2} strokeLinejoin="round" />
      <path d={carte.limites} fill="none" className="stroke-neutre-300" strokeWidth={2} strokeDasharray="6 5" />
      <g className="motion-safe:duration-1000 motion-safe:ease-out motion-safe:animate-in motion-safe:fade-in-0">
        {carte.points.map((p) => (
          <path key={p.couleur} d={p.d} stroke={p.couleur} strokeWidth={9} strokeLinecap="round" />
        ))}
      </g>
    </svg>
  );
}

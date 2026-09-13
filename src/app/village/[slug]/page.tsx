import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CarteVariante } from "@/components/carte-variante";
import { chargerVillage, slugsVillagesAttestes } from "@/lib/villages";
import { LIBELLES_DEPARTEMENT } from "@/lib/dictionnaire";

// Fiche publique d'un village (doc 20, étape 3). Un toponyme EST une commune :
// cette page n'est pas un second modèle, c'est le lemme rattaché à la commune
// vu depuis l'autre bout — `chargerVillage()` s'appuie sur `chargerLemmeDetaille()`.
//
// Générée statiquement pour les 819 communes qui ont déjà une forme attestée
// (les seules qu'on indexe — une page vide est du thin content). Les 786
// autres restent joignables à cette même URL, rendues à la demande et en
// `noindex` : la barrière d'indexation est ici, dans les métadonnées, jamais
// dans le navigateur.
export async function generateStaticParams() {
  const slugs = await slugsVillagesAttestes();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const village = await chargerVillage(slug);
  if (!village) return {};

  const departement = LIBELLES_DEPARTEMENT[village.departement] ?? village.departement;

  if (!village.lemme) {
    return {
      title: `${village.nom} — Elsass Dico`,
      description: `${village.nom} (${departement}) n'a pas encore de nom alsacien attesté dans Elsass Dico.`,
      robots: { index: false, follow: true },
    };
  }

  const premiereForme = village.lemme.variantes[0]?.forme;
  return {
    title: `${village.nom}${premiereForme ? ` — ${premiereForme}` : ""} — Elsass Dico`,
    description: premiereForme
      ? `Le nom alsacien de ${village.nom} (${departement}) : ${premiereForme}. Sources et variantes attestées.`
      : `${village.nom} (${departement}) dans Elsass Dico.`,
  };
}

export default async function VillagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const village = await chargerVillage(slug);
  if (!village) notFound();

  const departement = LIBELLES_DEPARTEMENT[village.departement] ?? village.departement;
  const nbFormes = village.lemme?.variantes.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-16 md:pb-4 md:pl-20 lg:pl-56">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutre-400">
          {departement}
          {village.aireLinguistique === "alsacien" ? " · aire alsacienne" : ""}
        </p>
        <h1 className="text-2xl font-bold text-foreground">{village.nom}</h1>
        {village.population !== null && (
          <p className="text-sm text-muted-foreground">
            {village.population.toLocaleString("fr-FR")} habitants
          </p>
        )}
      </header>

      {village.lemme ? (
        <section className="space-y-2.5">
          <h2 className="text-sm font-semibold text-neutre-400">
            Nom{nbFormes > 1 ? "s" : ""} alsacien{nbFormes > 1 ? "s" : ""}
          </h2>
          <div className="flex flex-col gap-2.5">
            {village.lemme.variantes.map((v) => (
              <CarteVariante key={v.id} variante={v} />
            ))}
          </div>
        </section>
      ) : (
        // Pas de lien vers un geste qui n'existe pas encore : la contribution
        // est l'étape 5 de la refonte, pas celle-ci. Un lien mort est pire
        // qu'une absence (même règle que sur la page de recherche).
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Personne n&apos;a encore proposé de nom alsacien pour {village.nom}.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        <Link href="/sources" className="underline">
          Sources et licences
        </Link>
      </p>
    </main>
  );
}

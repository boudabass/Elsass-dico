import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CarteVariante } from "@/components/carte-variante";
import { FichePublique } from "@/components/fiche-publique";
import { chargerLemmeDetaille, slugsPrenomsAttestes } from "@/lib/lemmes";

// Fiche publique d'un prénom (doc 20, étape 3) — même contenu que la fiche
// authentifiée /entree/[id] (CarteVariante), mais accessible sans compte et
// générée statiquement : contrairement aux villages, il n'existe pas de
// prénom « sans forme attestée », chaque lemme prénom naît d'une attestation.

export async function generateStaticParams() {
  const slugs = await slugsPrenomsAttestes();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lemme = await chargerLemmeDetaille({ slug });
  if (!lemme || lemme.type !== "prenom") return {};

  const formes = lemme.variantes.map((v) => v.forme);
  const premiereForme = formes[0];
  return {
    title: `${lemme.francais}${premiereForme ? ` (${premiereForme})` : ""} · Elsass Dico`,
    description: premiereForme
      ? `Le prénom ${lemme.francais} en alsacien : ${formes.slice(0, 3).join(", ")}. Chaque forme avec ses sources et ses villages.`
      : `Le prénom ${lemme.francais} dans Elsass Dico.`,
  };
}

export default async function PrenomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lemme = await chargerLemmeDetaille({ slug });
  if (!lemme || lemme.type !== "prenom") notFound();

  return (
    <FichePublique titre={lemme.francais} className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prénom</p>
        <h1 className="text-2xl font-bold text-foreground">{lemme.francais}</h1>
      </header>

      <section className="space-y-2.5">
        <div className="flex flex-col gap-2.5">
          {lemme.variantes.map((v) => (
            <CarteVariante key={v.id} variante={v} />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        <Link href="/sources" className="underline">
          Sources et licences
        </Link>
      </p>
    </FichePublique>
  );
}

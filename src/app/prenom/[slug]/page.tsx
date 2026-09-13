import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CarteVariante } from "@/components/carte-variante";
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

  const premiereForme = lemme.variantes[0]?.forme;
  return {
    title: `${lemme.francais}${premiereForme ? ` — ${premiereForme}` : ""} — Elsass Dico`,
    description: premiereForme
      ? `Le prénom ${lemme.francais} en alsacien : ${premiereForme}. Sources et variantes attestées.`
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
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-16 md:pb-4 md:pl-20 lg:pl-56">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutre-400">Prénom</p>
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
    </main>
  );
}

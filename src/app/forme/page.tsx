import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CarteVariante } from "@/components/carte-variante";
import { chargerFormeAction } from "@/app/actions/formes";
import { precisionLemme } from "@/lib/dictionnaire";
import { VoteVariante } from "@/app/entree/[id]/vote-variante";

// La fiche d'une forme, côté alsacien → français (27/09/2026). Pendant de
// /entree/[id] : là on part d'un mot français et on voit ses formes, ici on
// part d'une forme et on voit ce qu'elle veut dire.
//
// Adressée par `?c=` plutôt que par un segment de chemin : une forme peut
// contenir une barre oblique (il y en a dans les sources), et un `%2F` dans un
// segment ne survit pas à tous les proxys.
//
// On vote ici comme sur la fiche d'un mot — le vote porte sur une variante,
// c'est-à-dire sur un couple forme × sens. On n'y ajoute pas de forme : une
// nouvelle graphie se propose sur la fiche du mot français.
export default async function FormePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const forme = c ? await chargerFormeAction(c) : null;

  if (!forme) notFound();

  const nbSens = forme.sens.length;

  return (
    <div className="flex min-h-ecran flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader variant="root" actif="recherche" backHref />

      <main className="flex-1 px-4 pt-[18px] pb-8">
        <h1 className="text-[32px] font-extrabold leading-[1.1] text-foreground">{forme.titre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {nbSens > 1 ? `${nbSens} sens en français` : "1 sens en français"}
        </p>

        <div className="mt-5 flex flex-col gap-7">
          {forme.sens.map(({ lemme, variantes }) => (
            <section key={lemme.id} aria-labelledby={`sens-${lemme.id}`}>
              <Link
                href={`/entree/${lemme.id}`}
                className="group flex items-center justify-between gap-3 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="min-w-0">
                  <span id={`sens-${lemme.id}`} className="block truncate text-xl font-bold text-foreground">
                    {lemme.francais}
                  </span>
                  {precisionLemme(lemme) && (
                    <span className="block truncate text-sm text-muted-foreground">{precisionLemme(lemme)}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-sens-texte group-hover:underline">
                  Toutes ses formes
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </span>
              </Link>

              <div className="mt-2 flex flex-col gap-2.5">
                {variantes.map((v) => (
                  <CarteVariante
                    key={v.id}
                    variante={v}
                    accessoire={<VoteVariante varianteId={v.id} monVote={v.monVote ?? false} />}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

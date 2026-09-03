"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BadgeConfiance } from "@/components/badge-confiance";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { lettresDisponiblesAction, entreesParLettreAction } from "@/app/actions/navigation";
import type { Entree } from "@/lib/dictionnaire";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { useScrollMemorise } from "@/hooks/use-scroll-memorise";
import { cleCache, memoriserUrlOnglet } from "@/lib/cache-navigation";

// Écran 3 (Dictionnaire A-Z) + écran 11 (lettre vide) du handoff mobile.
//
// Interprétation retenue pour "tapping a letter scrolls/loads that letter's
// group" (README du handoff) : un tap CHARGE le groupe de cette lettre (une
// lettre affichée à la fois), plutôt qu'un long défilement continu A-Z avec
// scroll-to — cohérent avec entrees_par_lettre() qui sert une lettre à la
// fois (migration 20260829000000), et évite de charger tout le dictionnaire
// d'un coup à mesure qu'il grossit.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function DictionnairePage() {
  return (
    <Suspense fallback={<AppHeader variant="root" actif="dictionnaire" titre="Dictionnaire" />}>
      <DictionnaireContenu />
    </Suspense>
  );
}

function DictionnaireContenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lettreDepuisUrl = searchParams.get("lettre");

  // L'alphabet disponible ne change qu'à une publication : il se garde plus
  // longtemps que les listes, et cesse ainsi de coûter un appel par visite.
  const { donnees: lettres } = useListeMemorisee<string[]>({
    cle: cleCache("dictionnaire", "lettres"),
    charger: lettresDisponiblesAction,
    fraicheurMs: 5 * 60_000,
  });
  const disponibles = useMemo(() => (lettres ? new Set(lettres) : null), [lettres]);

  // Lettre restaurée depuis l'URL au premier chargement (retour navigateur
  // depuis une fiche de mot) plutôt que toujours repartir sur la première
  // lettre disponible.
  const [lettre, setLettre] = useState<string | null>(() => lettreDepuisUrl);

  useEffect(() => {
    if (!lettres) return;
    setLettre((actuelle) => (actuelle && lettres.includes(actuelle) ? actuelle : lettres[0] ?? null));
  }, [lettres]);

  function choisirLettre(car: string) {
    setLettre(car);
    const url = `/dictionnaire?lettre=${car}`;
    router.replace(url, { scroll: false });
    // La barre de nav rouvrira le dictionnaire sur cette lettre.
    memoriserUrlOnglet("dictionnaire", url);
  }

  const cleLettre = lettre ? cleCache("dictionnaire", "lettre", lettre) : null;
  const { donnees: entreesChargees, premierChargement } = useListeMemorisee<Entree[]>({
    cle: cleLettre,
    charger: () => entreesParLettreAction(lettre as string),
  });
  const entrees = entreesChargees ?? [];
  // Une revalidation en fond ne doit jamais remettre le squelette : la liste
  // reste à l'écran et se met à jour quand la réponse arrive.
  const chargement = premierChargement || (lettre !== null && entreesChargees === null);

  useScrollMemorise(cleLettre, entrees.length > 0);

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader variant="root" actif="dictionnaire" titre="Dictionnaire" />

      <div className="flex gap-1.5 overflow-x-auto border-b border-border px-4 pb-1 pt-3">
        {ALPHABET.map((car) => {
          const dispo = disponibles?.has(car) ?? false;
          const active = lettre === car;
          return (
            <button
              key={car}
              type="button"
              disabled={!dispo}
              onClick={() => choisirLettre(car)}
              className={
                active
                  ? "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-marque-rouge-500 text-[13px] font-bold text-white"
                  : dispo
                    ? "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-neutre-100 text-[13px] font-bold text-neutre-400 transition-colors hover:bg-neutre-300/40"
                    : "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-neutre-300"
              }
            >
              {car}
            </button>
          );
        })}
      </div>

      <main className="flex-1 px-4 pb-8">
        {disponibles === null || chargement ? (
          <div className="pt-4">
            <ListSkeleton />
          </div>
        ) : !lettre || entrees.length === 0 ? (
          <div className="flex flex-col items-center px-3 pb-2 pt-10 text-center">
            <BookOpen className="h-[30px] w-[30px] text-neutre-300" strokeWidth={1.8} />
            <p className="mt-3 text-[15px] font-bold text-foreground">
              Aucune entrée validée pour la lettre {lettre ?? "—"} pour l&apos;instant.
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              De nouveaux mots arrivent chaque semaine.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="pt-4 pb-2 text-[26px] font-extrabold text-foreground">{lettre}</h2>
            <div className="flex flex-col">
              {entrees.map((e, i) => (
                <Link
                  key={e.id}
                  href={`/entree/${e.id}`}
                  className={
                    i < entrees.length - 1
                      ? "flex items-center justify-between gap-3 border-b border-border py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      : "flex items-center justify-between gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold text-foreground">
                      {e.francais}
                      {e.contexte && <span className="font-normal text-neutre-400"> ({e.contexte})</span>}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {e.traductions[0]?.alsacien}
                    </div>
                  </div>
                  <BadgeConfiance nbSources={e.nb_sources} />
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutre-300" strokeWidth={2.4} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

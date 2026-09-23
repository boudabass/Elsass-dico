"use client";

import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BadgeConfiance } from "@/components/badge-confiance";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
  lettresDisponiblesAction,
  lemmesParLettreAction,
  pageDuPrefixeAction,
  type PageLettre,
} from "@/app/actions/navigation";
import { precisionLemme } from "@/lib/dictionnaire";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { useScrollMemorise } from "@/hooks/use-scroll-memorise";
import { chargerAvecCache, cleCache, memoriserUrlOnglet } from "@/lib/cache-navigation";
import { cn } from "@/lib/utils";

// Écran 3 (Dictionnaire A-Z) + écran 11 (lettre vide) du handoff mobile.
//
// Interprétation retenue pour "tapping a letter scrolls/loads that letter's
// group" (README du handoff) : un tap CHARGE le groupe de cette lettre (une
// lettre affichée à la fois), plutôt qu'un long défilement continu A-Z avec
// scroll-to — cohérent avec `lemmesParLettreAction()` qui sert une lettre à la
// fois, et évite de charger tout le dictionnaire d'un coup à mesure qu'il
// grossit. Il y a 25 864 lemmes : le défilement continu n'était pas une option.
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
  const pageDepuisUrl = Number(searchParams.get("page")) || 1;

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
  const [pageNo, setPageNo] = useState(pageDepuisUrl);

  useEffect(() => {
    if (!lettres) return;
    setLettre((actuelle) => (actuelle && lettres.includes(actuelle) ? actuelle : lettres[0] ?? null));
  }, [lettres]);

  function choisirLettre(car: string) {
    setLettre(car);
    setPageNo(1);
    const url = `/dictionnaire?lettre=${car}`;
    router.replace(url, { scroll: false });
    // La barre de nav rouvrira le dictionnaire sur cette lettre.
    memoriserUrlOnglet("dictionnaire", url);
  }

  function allerPage(n: number) {
    if (!lettre) return;
    setPageNo(n);
    const url = `/dictionnaire?lettre=${lettre}&page=${n}`;
    router.replace(url, { scroll: false });
    memoriserUrlOnglet("dictionnaire", url);
    // Un changement de page n'est pas un retour (cf. `estRetourHistorique()`) :
    // `useScrollMemorise` ne remonte donc pas seul, et rester scrollé au
    // niveau du bouton « Suivant » cliqué en bas de liste serait désorientant.
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Champ « Aller à un mot » (retour de John, 14/09/2026) : 12 clics pour
  // atteindre « bricoler », 30 pour « cytise ». `pageDuPrefixeAction` calcule
  // la page avec le même tri que la liste, puis `allerPage` fait le reste —
  // même mise à jour d'URL, même remontée en haut.
  const [prefixe, setPrefixe] = useState("");
  const [rechercheEnCours, setRechercheEnCours] = useState(false);

  async function allerAuPrefixe() {
    if (!lettre || !prefixe.trim() || rechercheEnCours) return;
    setRechercheEnCours(true);
    try {
      const n = await pageDuPrefixeAction(lettre, prefixe);
      // Pré-remplit le cache de la page cible AVANT de faire bouger `pageNo` :
      // `useListeMemorisee` relit le cache de façon SYNCHRONE pendant le
      // rendu dès que sa clé change (son `cleRef`), donc si l'entrée existe
      // déjà, la liste s'affiche immédiatement — sans dépendre de l'effet qui
      // va chercher les données, dont le redéclenchement après un `await`
      // s'est révélé intermittent à l'écran le 14/09/2026 (même avec
      // `startTransition` autour de `allerPage`, gardé ci-dessous par
      // prudence mais insuffisant seul pour fiabiliser à 100 %).
      await chargerAvecCache(cleCache("dictionnaire", "lettre", lettre, String(n)), () =>
        lemmesParLettreAction(lettre, n),
      );
      startTransition(() => {
        allerPage(n);
        setPrefixe("");
      });
    } finally {
      setRechercheEnCours(false);
    }
  }

  const cleLettre = lettre ? cleCache("dictionnaire", "lettre", lettre, String(pageNo)) : null;
  const { donnees: page, premierChargement } = useListeMemorisee<PageLettre>({
    cle: cleLettre,
    charger: () => lemmesParLettreAction(lettre as string, pageNo),
  });
  const lemmes = page?.lemmes ?? [];
  // Une revalidation en fond ne doit jamais remettre le squelette : la liste
  // reste à l'écran et se met à jour quand la réponse arrive.
  const chargement = premierChargement || (lettre !== null && page === null);

  useScrollMemorise(cleLettre, lemmes.length > 0);

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
              aria-current={active ? "true" : undefined}
              onClick={() => choisirLettre(car)}
              className={cn(
                "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                active
                  ? "bg-marque-rouge-500 text-white"
                  : dispo
                    ? "bg-neutre-100 text-muted-foreground transition-colors hover:bg-neutre-300/40"
                    : "text-neutre-300",
              )}
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
        ) : !lettre || lemmes.length === 0 ? (
          <div className="flex flex-col items-center px-3 pb-2 pt-10 text-center">
            <BookOpen className="h-[30px] w-[30px] text-neutre-300" strokeWidth={1.8} />
            <p className="mt-3 text-[15px] font-bold text-foreground">
              {lettre ? `Aucun mot pour la lettre ${lettre}.` : "Aucun mot pour l'instant."}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Le dictionnaire s&apos;enrichit des formes que les membres apportent.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-baseline gap-2 pt-4 pb-2">
              <h2 className="text-[26px] font-extrabold text-foreground">{lettre}</h2>
              <span className="text-sm text-muted-foreground">
                {page && page.nbPages > 1
                  ? `${page.total.toLocaleString("fr-FR")} mots, page ${page.page} sur ${page.nbPages}`
                  : `${lemmes.length} mot${lemmes.length > 1 ? "s" : ""}`}
              </span>
            </div>

            {page && page.nbPages > 1 && (
              <>
                <ChampAllerAuMot
                  valeur={prefixe}
                  onChange={setPrefixe}
                  onValider={allerAuPrefixe}
                  disabled={rechercheEnCours}
                />
                <ControlesPagination page={page.page} nbPages={page.nbPages} onPage={allerPage} />
              </>
            )}

            <div className="flex flex-col">
              {lemmes.map((e, i) => (
                <Link
                  key={e.id}
                  href={`/entree/${e.id}`}
                  className={
                    i < lemmes.length - 1
                      ? "flex items-center justify-between gap-3 border-b border-border py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      : "flex items-center justify-between gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold text-foreground">
                      {e.francais}
                      {precisionLemme(e) && (
                        <span className="font-normal text-muted-foreground"> ({precisionLemme(e)})</span>
                      )}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {/* Les formes se lisent sur la fiche ; ici la premiere
                          suffit a reconnaitre le mot, et son badge dit ce qui
                          la fonde — jamais une forme sans son fondement. */}
                      {e.formes[0]?.forme}
                      {e.nbFormes > 1 && (
                        <span className="text-muted-foreground"> +{e.nbFormes - 1}</span>
                      )}
                    </div>
                  </div>
                  {e.formes[0] && (
                    <BadgeConfiance
                      nbSources={e.formes[0].nbSources}
                      nbVillages={e.formes[0].nbVillages}
                    />
                  )}
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutre-300" strokeWidth={2.4} />
                </Link>
              ))}
            </div>

            {page && page.nbPages > 1 && (
              <ControlesPagination page={page.page} nbPages={page.nbPages} onPage={allerPage} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Répétés en haut et en bas de la liste (retour de John, 14/09/2026) : en
// haut pour changer de page sans redescendre après un clic sur une lettre, en
// bas pour tourner la page sans remonter après avoir lu jusqu'au dernier mot.
function ControlesPagination({
  page,
  nbPages,
  onPage,
}: {
  page: number;
  nbPages: number;
  onPage: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="flex h-9 items-center gap-1 rounded-full border border-bordure-forte px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
        Précédent
      </button>
      <span className="text-sm font-medium text-muted-foreground">
        {page} / {nbPages}
      </span>
      <button
        type="button"
        disabled={page >= nbPages}
        onClick={() => onPage(page + 1)}
        className="flex h-9 items-center gap-1 rounded-full border border-bordure-forte px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50 disabled:pointer-events-none disabled:opacity-40"
      >
        Suivant
        <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}

function ChampAllerAuMot({
  valeur,
  onChange,
  onValider,
  disabled,
}: {
  valeur: string;
  onChange: (v: string) => void;
  onValider: () => void;
  disabled: boolean;
}) {
  return (
    <form
      onSubmit={(evt) => {
        evt.preventDefault();
        onValider();
      }}
      className="flex items-center gap-2 pt-1 pb-2.5"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutre-300" strokeWidth={2.4} />
        <input
          type="text"
          value={valeur}
          onChange={(evt) => onChange(evt.target.value)}
          placeholder="Aller à un mot…"
          className="h-9 w-full rounded-full border border-bordure-forte bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-neutre-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !valeur.trim()}
        className="flex h-9 shrink-0 items-center rounded-full bg-marque-rouge-500 px-3.5 text-sm font-semibold text-white transition-colors disabled:pointer-events-none disabled:opacity-40"
      >
        Aller
      </button>
    </form>
  );
}

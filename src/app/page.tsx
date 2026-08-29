"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, SearchX } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { rechercherAction, type ResultatRecherche } from "@/app/actions/recherche";
import { useAuth } from "@/components/auth-provider";

// Écran 1 (Recherche) + écran 10 (aucun résultat) du handoff mobile
// design_handoff_mobile_app/ (Claude Design, 28/08/2026). Remplace la page
// desktop du 25/08 : plus de bandeau marketing ni de boutons de connexion en
// en-tête (portés désormais par l'onglet "compte" de AppHeader et par l'écran
// Mon espace), fidèle au mockup qui réduit l'accueil à saluer + chercher.

const CARACTERES_ORTHAL = ["à", "ì", "ü", "ù", "ë", "ö", "ä", "œ"];

export default function AccueilPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [aCherche, setACherche] = useState(false);

  // Recherche différée : la frappe ne doit pas déclencher un aller-retour par
  // caractère, et la RPC refuse de toute façon les termes d'un seul caractère.
  useEffect(() => {
    const requete = terme.trim();
    if (requete.length < 2) {
      setResultats([]);
      setACherche(false);
      setRecherche(false);
      return;
    }

    setRecherche(true);
    const minuteur = setTimeout(async () => {
      const trouves = await rechercherAction(requete);
      setResultats(trouves);
      setACherche(true);
      setRecherche(false);
    }, 250);

    return () => clearTimeout(minuteur);
  }, [terme]);

  // Insère le caractère à l'endroit du curseur plutôt qu'en fin de chaîne :
  // selectionStart/End restent lisibles sur l'input même après que le focus
  // soit passé au bouton de la puce (le spec DOM les conserve). requestAnimationFrame
  // laisse React committer le nouveau `value` avant qu'on repositionne le curseur.
  function insererCaractere(car: string) {
    const input = inputRef.current;
    const debut = input?.selectionStart ?? terme.length;
    const fin = input?.selectionEnd ?? terme.length;
    setTerme(terme.slice(0, debut) + car + terme.slice(fin));
    requestAnimationFrame(() => {
      input?.focus();
      const position = debut + car.length;
      input?.setSelectionRange(position, position);
    });
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader variant="root" actif="recherche" />

      <main className="flex-1 px-4 pt-5 pb-8">
        <h1 className="text-[21px] font-extrabold text-foreground">Salut !</h1>
        <p className="mt-1 mb-[18px] text-sm text-muted-foreground">
          Cherche un mot, français ou alsacien.
        </p>

        <div className="flex h-12 items-center gap-2.5 rounded-full border border-neutre-300 bg-background px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-neutre-400" strokeWidth={2} />
          <input
            ref={inputRef}
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Un mot en français ou en alsacien…"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-neutre-400"
          />
          <span
            aria-hidden
            className={`shrink-0 transition-[opacity,transform,filter] duration-300 ease-doux ${
              recherche ? "opacity-100 blur-0" : "opacity-0 scale-[0.25] blur-[4px]"
            }`}
          >
            <Loader2 className={`h-[18px] w-[18px] text-neutre-400 ${recherche ? "animate-spin" : ""}`} />
          </span>
          <span role="status" aria-live="polite" className="sr-only">
            {recherche ? "Recherche en cours" : ""}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {CARACTERES_ORTHAL.map((car) => (
            <button
              key={car}
              type="button"
              onClick={() => insererCaractere(car)}
              className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-neutre-300 bg-background px-2.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-neutre-50 active:scale-95"
            >
              {car}
            </button>
          ))}
        </div>

        {recherche && resultats.length === 0 && (
          <div className="mt-[22px]">
            <ListSkeleton lignes={3} />
          </div>
        )}

        {!recherche && resultats.length > 0 && (
          <div>
            <p className="mb-2.5 mt-[22px] text-xs font-bold uppercase tracking-wide text-neutre-400">
              Résultats
            </p>
            <div className="space-y-2.5">
              {resultats.map((e) => (
                <Link
                  key={e.id}
                  href={`/entree/${e.id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="rounded-lg border border-border bg-card p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground">{e.francais}</span>
                      {e.contexte && (
                        <span className="text-xs text-neutre-400">{e.contexte}</span>
                      )}
                    </div>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {e.traductions[0]?.alsacien}
                    </p>
                    {e.traductions.length > 1 ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        aussi : {e.traductions.slice(1).map((t) => t.alsacien).join(" · ")}
                      </p>
                    ) : e.traductions[0]?.region === "commun" ? (
                      <span className="mt-2 inline-flex rounded-full bg-marque-or-50 px-2.5 py-0.5 text-xs font-semibold text-marque-or-700">
                        Alsacien unifié
                      </span>
                    ) : e.traductions[0]?.region ? (
                      <span className="mt-2 inline-flex rounded-full bg-neutre-100 px-2.5 py-0.5 text-xs font-semibold text-neutre-600">
                        {e.traductions[0].region === "haut_rhin" ? "Haut-Rhin" : "Bas-Rhin"}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {aCherche && !recherche && resultats.length === 0 && (
          <div className="mt-3.5 flex flex-col items-center px-3 pb-2 pt-9 text-center">
            <SearchX className="h-[34px] w-[34px] text-neutre-300" strokeWidth={1.8} />
            <p className="mt-3 text-base font-bold text-foreground">
              Aucun résultat pour « {terme.trim()} ».
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ce mot n&apos;est pas encore dans le dictionnaire.
            </p>
            {user && (
              <Link
                href={`/contributions/proposer?francais=${encodeURIComponent(terme.trim())}`}
                className="mt-2.5 text-sm font-semibold text-marque-rouge-texte"
              >
                Proposer ce mot →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

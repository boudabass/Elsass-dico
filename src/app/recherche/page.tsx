"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Search, SearchX } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BadgeConfiance } from "@/components/badge-confiance";
import { CarteForme } from "@/components/carte-forme";
import { useSens, useSensDepuisUrl } from "@/components/sens-provider";
import { EchecChargement } from "@/components/echec-chargement";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { rechercherFormesAction } from "@/app/actions/formes";
import { rechercherAction } from "@/app/actions/recherche";
import { lienForme, precisionLemme, type FormeResume, type LemmeResume } from "@/lib/dictionnaire";
import { parametreSens, type Sens } from "@/lib/sens";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { useRequeteDebattue } from "@/hooks/use-requete-debattue";
import { useScrollMemorise } from "@/hooks/use-scroll-memorise";
import { cleCache, memoriserUrlOnglet, remplacerUrl } from "@/lib/cache-navigation";

// Écran 1 (Recherche) + écran 10 (aucun résultat) du handoff mobile
// design_handoff_mobile_app/ (Claude Design, 28/08/2026). Remplace la page
// desktop du 25/08 : plus de bandeau marketing ni de boutons de connexion en
// en-tête (portés désormais par l'onglet "compte" de AppHeader et par l'écran
// Mon espace), réduit à la seule barre de recherche depuis le 26/09/2026.
//
// Déplacée de `/` vers `/recherche` le 13/09/2026 (doc 20, étape 3) : `/`
// devient la présentation publique, sans compte — cet écran, lui, reste
// entièrement derrière l'authentification.
//
// Un seul sens à la fois depuis le 27/09/2026 (décision de John) : le sens
// vient de l'inverseur tout en haut de l'app. Depuis le français, on trouve des
// mots et leurs formes ; depuis l'alsacien, des formes et ce qu'elles veulent
// dire. La recherche mélangée ne disait pas ce qui avait correspondu.

type Resultats =
  | { sens: "fr"; liste: LemmeResume[] }
  | { sens: "als"; liste: FormeResume[] };

function urlRecherche(requete: string, sens: Sens): string {
  const params = [requete ? `q=${encodeURIComponent(requete)}` : "", parametreSens(sens)].filter(Boolean);
  return params.length ? `/recherche?${params.join("&")}` : "/recherche";
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<AppHeader variant="root" actif="recherche" />}>
      <RechercheContenu />
    </Suspense>
  );
}

function RechercheContenu() {
  const searchParams = useSearchParams();
  useSensDepuisUrl(searchParams.get("sens"));
  const { sens, definirSens } = useSens();
  // Terme restauré depuis l'URL au premier chargement (retour navigateur
  // depuis une fiche de mot) plutôt que toujours repartir d'une recherche vide.
  const [terme, setTerme] = useState(() => searchParams.get("q") ?? "");
  // Terme réellement soumis, une fois la frappe retombée. C'est lui qui fait
  // la clé de cache : deux visites du même terme ne rappellent pas le serveur.
  const requete = useRequeteDebattue(terme);

  // Le sens entre dans la clé : inverser avec un terme saisi relance la
  // recherche dans l'autre langue, sans resservir la liste de la première.
  const cle = requete ? cleCache("recherche", sens, requete) : null;
  const { donnees, premierChargement, echec, rafraichir } = useListeMemorisee<Resultats>({
    cle,
    charger: async (): Promise<Resultats> =>
      sens === "als"
        ? { sens: "als", liste: await rechercherFormesAction(requete) }
        : { sens: "fr", liste: await rechercherAction(requete) },
  });
  // Une liste de l'autre sens (encore à l'écran le temps de recharger) ne
  // s'affiche jamais sous la couleur de celui-ci.
  const resultats = donnees && donnees.sens === sens ? donnees : null;
  const nbResultats = resultats?.liste.length ?? 0;
  const autreSens: Sens = sens === "fr" ? "als" : "fr";

  // Le spinner couvre aussi la fenêtre de debounce : sans ça, taper une lettre
  // de plus laisserait l'écran figé sur les résultats précédents sans rien
  // indiquer.
  const attenteFrappe = terme.trim().length >= 2 && terme.trim() !== requete;
  const recherche = attenteFrappe || premierChargement || (cle !== null && resultats === null && !echec);
  const aCherche = cle !== null && resultats !== null;

  useScrollMemorise(cle, nbResultats > 0);

  // L'URL suit la requête (replace, pas push), pour qu'un retour depuis une
  // fiche de mot retombe sur la même recherche. Rien à faire quand elle la
  // porte déjà — c'est le cas au montage, restauré depuis l'URL.
  //
  // Seulement une fois la recherche arrivée : Next intercepte
  // `history.replaceState`, qui ferait abandonner une Server Action en vol
  // (cf. dictionnaire, 27/09/2026).
  useEffect(() => {
    if (recherche) return;
    const url = urlRecherche(requete, sens);
    const actuelle = urlRecherche((searchParams.get("q") ?? "").trim(), searchParams.get("sens") === "als" ? "als" : "fr");
    if (url === actuelle) return;
    remplacerUrl(url);
    // La barre de nav rouvrira la recherche ici plutôt que sur un écran vide.
    memoriserUrlOnglet("recherche", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requete, sens, recherche]);


  return (
    <div className="flex min-h-ecran flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader variant="root" actif="recherche" />

      <main className="flex-1 px-4 pt-5 pb-8">
        {/* Rien que la barre (26/09/2026, John) : plus de salut ni de puces
            de caractères ; bordure rouge, 20 % plus grande (48 → 58 px). */}
        <div className="flex h-[58px] items-center gap-3 rounded-full border-2 border-sens-500 bg-background px-5 transition-colors duration-200">
          <Search className="h-[22px] w-[22px] shrink-0 text-sens-texte" strokeWidth={2} />
          <input
            aria-label={sens === "als" ? "Chercher un mot en alsacien" : "Chercher un mot en français"}
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder={sens === "als" ? "Un mot en alsacien…" : "Un mot en français…"}
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[19px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />
          <span
            aria-hidden
            className={`shrink-0 transition-[opacity,transform,filter] duration-300 ease-doux ${
              recherche ? "opacity-100 blur-0" : "opacity-0 scale-[0.25] blur-[4px]"
            }`}
          >
            <Loader2 className={`h-[22px] w-[22px] text-muted-foreground ${recherche ? "animate-spin" : ""}`} />
          </span>
          <span role="status" aria-live="polite" className="sr-only">
            {recherche ? "Recherche en cours" : ""}
          </span>
        </div>

        {echec && !attenteFrappe && <EchecChargement onReessayer={rafraichir} />}

        {recherche && nbResultats === 0 && (
          <div className="mt-[22px]">
            <ListSkeleton lignes={3} />
          </div>
        )}

        {!recherche && resultats?.sens === "als" && nbResultats > 0 && (
          <div>
            <p className="mb-2.5 mt-[22px] text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Résultats
            </p>
            <div className="space-y-2.5">
              {resultats.liste.map((f) => (
                <Link
                  key={f.cle}
                  href={lienForme(f.cle)}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <CarteForme forme={f} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {!recherche && resultats?.sens === "fr" && nbResultats > 0 && (
          <div>
            <p className="mb-2.5 mt-[22px] text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Résultats
            </p>
            <div className="space-y-2.5">
              {resultats.liste.map((e) => (
                <Link
                  key={e.id}
                  href={`/entree/${e.id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="rounded-lg border border-border bg-card p-3.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-foreground">{e.francais}</span>
                      {precisionLemme(e) && (
                        <span className="text-xs text-muted-foreground">{precisionLemme(e)}</span>
                      )}
                    </div>
                    {/* Toutes les formes, chacune avec ce qui la fonde. Plus de
                        forme canonique depuis le 11/09/2026 : la première n'est
                        pas « la bonne », c'est celle que le plus de témoins
                        écrivent. */}
                    <ul className="mt-1.5 space-y-1">
                      {e.formes.map((f) => (
                        <li key={f.forme} className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-foreground">{f.forme}</span>
                          <BadgeConfiance nbSources={f.nbSources} nbVillages={f.nbVillages} />
                        </li>
                      ))}
                    </ul>
                    {e.nbFormes > e.formes.length && (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        et {e.nbFormes - e.formes.length} autre
                        {e.nbFormes - e.formes.length > 1 ? "s" : ""} forme
                        {e.nbFormes - e.formes.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {aCherche && !recherche && nbResultats === 0 && (
          <div className="mt-3.5 flex flex-col items-center px-3 pb-2 pt-9 text-center">
            <SearchX className="h-[34px] w-[34px] text-neutre-300" strokeWidth={1.8} />
            <p className="mt-3 text-base font-bold text-foreground">
              Aucun résultat pour « {terme.trim()} ».
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {sens === "als"
                ? "Aucune forme alsacienne ne s'écrit comme ça pour l'instant."
                : "Aucun mot français ne s'écrit comme ça pour l'instant."}
            </p>
            {/* Plus de recherche mélangée : si le mot était de l'autre
                langue, on le dit ici et on retourne le livre en un geste. */}
            <button
              type="button"
              onClick={() => definirSens(autreSens)}
              className={`mt-4 inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-white transition-colors ${
                autreSens === "als" ? "bg-marque-rouge-500 hover:bg-marque-rouge-600" : "bg-bleu-500 hover:bg-bleu-600"
              }`}
            >
              Chercher «&nbsp;{terme.trim()}&nbsp;» en {autreSens === "als" ? "alsacien" : "français"}
            </button>
            {/* Le « Proposer ce mot → » de l'ancien circuit pointait vers
                /contributions/proposer, supprimé le 12/09/2026 avec Supabase. Le
                geste revient à l'étape 5 de la refonte (le même écran créera le
                lemme ET sa première variante). Pas de lien en attendant : un lien
                mort est pire qu'une absence. */}
          </div>
        )}
      </main>
    </div>
  );
}

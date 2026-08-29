"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppNavShell, type OngletRacine } from "@/components/app-nav-shell";

// En-tête mobile-first du handoff design_handoff_mobile_app/ (Claude Design,
// 28/08/2026), complété le 29/08 par le standard de nav responsive
// documenté dans Claude Design (« The Elsassisch Design Systeme » -> AppNav) :
// les 3 destinations (Recherche/Dictionnaire/Mon espace), jusque-là des
// icônes fixes dans ce header à toutes les largeurs, sont maintenant portées
// par AppNavShell — barre d'onglets en bas sur mobile, rail vertical à
// gauche dès la tablette (`md`). Ce header ne garde que le wordmark/titre et
// le chevron retour ; AppNavShell est monté en overlay fixe à côté (voir
// AppHeader plus bas), pas dans le flux de ce header.
//
// Le mockup simule un padding-top de 54px pour dégager la fausse barre de
// statut du bezel de démo (ios-frame.jsx). Ici l'app tourne dans un vrai
// navigateur : on respecte plutôt env(safe-area-inset-top), qui ne vaut
// quelque chose que sur mobile/PWA installée et reste à 0 ailleurs.

interface AppHeaderRootProps {
  variant: "root";
  actif: OngletRacine;
  /** Absent : wordmark "Elsass Dico". Présent : titre de page (Dictionnaire, Mon espace…). */
  titre?: string;
  /** Écran 2 du handoff (fiche de mot) : chevron retour à la place du wordmark/titre, mais les 3 icônes de nav restent affichées (l'onglet d'origine reste actif). */
  backHref?: string;
}

interface AppHeaderStackProps {
  variant: "stack";
  titre: string;
  /** "fermer" pour les écrans modaux (Signaler) ; "retour" partout ailleurs (défaut). */
  leading?: "retour" | "fermer";
  /** Lien de retour explicite. À défaut, revient à l'historique du navigateur. */
  backHref?: string;
  trailing?: React.ReactNode;
}

type AppHeaderProps = AppHeaderRootProps | AppHeaderStackProps;

const BOUTON_ICONE =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors";

export function AppHeader(props: AppHeaderProps) {
  return (
    <>
      {props.variant === "root" ? <AppNavShell actif={props.actif} /> : null}
      <header
        className="sticky top-0 z-40 border-b border-border bg-background"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          {props.variant === "root" ? <EnteteRacine {...props} /> : <EnteteEmpilee {...props} />}
        </div>
      </header>
    </>
  );
}

function EnteteRacine({ titre, backHref }: AppHeaderRootProps) {
  return (
    <>
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Retour"
          className={cn(BOUTON_ICONE, "bg-neutre-100 text-foreground")}
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </Link>
      ) : titre ? (
        <span className="truncate text-xl font-extrabold text-foreground">{titre}</span>
      ) : (
        <span className="font-display text-xl text-marque-rouge-texte">Elsass&nbsp;Dico</span>
      )}
    </>
  );
}

function EnteteEmpilee({ titre, leading = "retour", backHref, trailing }: AppHeaderStackProps) {
  const router = useRouter();
  const Icone = leading === "fermer" ? X : ChevronLeft;
  const libelle = leading === "fermer" ? "Fermer" : "Retour";
  const classeBouton = cn(BOUTON_ICONE, "bg-neutre-100 text-foreground");

  return (
    <>
      {backHref ? (
        <Link href={backHref} aria-label={libelle} className={classeBouton}>
          <Icone className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </Link>
      ) : (
        <button type="button" onClick={() => router.back()} aria-label={libelle} className={classeBouton}>
          <Icone className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      )}
      <h1 className="flex-1 truncate text-center text-[17px] font-bold text-foreground">{titre}</h1>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">{trailing}</div>
    </>
  );
}

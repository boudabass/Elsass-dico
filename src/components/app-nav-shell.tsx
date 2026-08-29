"use client";

import Link from "next/link";
import { BookOpen, Gavel, Search, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

// Nav persistante des écrans racine (Recherche/Dictionnaire/Mon espace) :
// barre d'onglets en bas sur mobile, rail vertical à gauche dès la tablette
// (`md`). Même modèle que le rail/barre d'Elsass Game (AppShell,
// src/components/app-shell.tsx côté Elsass-Game — standardisé le 29/08/2026
// dans Claude Design, projet « The Elsassisch Design Systeme » -> AppNav),
// porté ici avec les tokens et les 3 destinations propres à Dico. `actif`
// vient du même prop que AppHeader recevait déjà pour ses icônes de header ;
// seule la mise en forme change, pas la logique de destinations (inchangée
// depuis le handoff du 28/08).
//
// Overlay en position fixe (pas un sibling flex du contenu de page) : évite
// de retoucher LayoutWrapper, qui portait déjà la correction de largeur du
// 29/08 (PR #17) et n'a pas besoin d'un second changement structurel dans la
// même semaine. Chaque écran racine réserve la place via un padding
// responsive (`md:pl-20 lg:pl-56` / `pb-16 md:pb-0`) sur son propre conteneur.
//
// 4e destination conditionnelle (30/08) : « Arbitrage », visible seulement
// pour role === "admin" (même condition stricte que le middleware sur
// /admin/*, pas juste "connecté" — un utilisateur/contributeur connecté ne
// peut de toute façon pas accéder à cette page). /admin/arbitrage garde son
// propre AppHeader en variant="stack" (trailing vers /admin, retour vers
// /dashboard) : cette icône ne s'affiche donc jamais "active" une fois sur
// la page elle-même, comme /admin aujourd'hui — seulement en highlight
// d'entrée depuis les 3 autres écrans racine.

export type OngletRacine = "recherche" | "dictionnaire" | "compte" | "arbitrage";

type Onglet = { cle: OngletRacine; href: string; icone: LucideIcon; libelle: string };

export const ONGLETS: Onglet[] = [
  { cle: "recherche", href: "/", icone: Search, libelle: "Recherche" },
  { cle: "dictionnaire", href: "/dictionnaire", icone: BookOpen, libelle: "Dictionnaire" },
  { cle: "compte", href: "/dashboard", icone: User, libelle: "Mon espace" },
];

// Réservé aux admins — même condition que le middleware sur /admin/* (rôle
// admin strict, pas juste "connecté") : un utilisateur ou contributeur
// connecté qui verrait cette icône se ferait rediriger vers /dashboard en
// cliquant dessus, ce que /admin/arbitrage impose déjà.
const ONGLET_ARBITRAGE: Onglet = {
  cle: "arbitrage",
  href: "/admin/arbitrage",
  icone: Gavel,
  libelle: "Arbitrage",
};

export function AppNavShell({ actif }: { actif: OngletRacine }) {
  const { role } = useAuth();
  const onglets = role === "admin" ? [...ONGLETS, ONGLET_ARBITRAGE] : ONGLETS;

  return (
    <>
      {/* Rail — tablette (icônes seules) et desktop (icônes + libellés) */}
      <nav
        aria-label="Navigation"
        className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center gap-1 border-r border-border bg-background py-4 md:flex lg:w-56 lg:items-stretch lg:px-4"
      >
        {onglets.map(({ cle, href, icone: Icone, libelle }) => {
          const estActif = actif === cle;
          return (
            <Link
              key={cle}
              href={href}
              aria-current={estActif ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:px-4",
                estActif
                  ? "bg-marque-rouge-500 text-white"
                  : "text-neutre-400 hover:bg-neutre-100 hover:text-foreground"
              )}
            >
              <Icone className="h-5 w-5 shrink-0" strokeWidth={estActif ? 2.4 : 1.8} />
              <span className="hidden lg:inline">{libelle}</span>
            </Link>
          );
        })}
      </nav>

      {/* Barre d'onglets — mobile uniquement */}
      <nav
        aria-label="Navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {onglets.map(({ cle, href, icone: Icone, libelle }) => {
          const estActif = actif === cle;
          return (
            <Link
              key={cle}
              href={href}
              aria-current={estActif ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                estActif ? "text-marque-rouge-texte" : "text-neutre-400"
              )}
            >
              <Icone className="h-5 w-5" strokeWidth={estActif ? 2.4 : 1.8} />
              {libelle}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

"use client";

import { useState } from "react";
import { connexionAction } from "@/app/actions/auth";
import { URL_INSCRIPTION_ODOO } from "@/lib/odoo";
import { AppHeader } from "@/components/app-header";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Écran 5 du handoff mobile. Le mockup montre un lien "Mot de passe oublié ?"
// qui n'a pas d'équivalent ici : Odoo est l'autorité sur les mots de passe et
// l'app n'a aucun flux de réinitialisation self-service (pas de SMTP, cf.
// CLAUDE.md 07/08/2026) — l'ajouter serait un lien mort.
//
// La « connexion de secours » (mot de passe Supabase si Odoo était injoignable)
// a disparu le 12/09/2026 avec Supabase. Elle reposait sur un second annuaire de
// mots de passe ; il n'y en a plus qu'un, et c'est Odoo.

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    setEnCours(true);

    const donnees = new FormData();
    donnees.set("email", email);
    donnees.set("password", motDePasse);
    const resultat = await connexionAction(donnees);
    setEnCours(false);

    if (!resultat.succes) {
      toast.error(resultat.erreur);
      return;
    }

    // Navigation complète volontaire : la session vient d'être posée en
    // cookies côté serveur, et le layout racine ne la relit qu'au rendu.
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant="stack" titre="Connexion" backHref="/" />

      <main className="flex-1 px-6 py-8">
        <p className="font-display text-center text-[26px] text-marque-rouge-texte">Elsass Dico</p>
        <h1 className="mt-[18px] text-center text-xl font-extrabold text-foreground">
          Heureux de te revoir
        </h1>
        <p className="mt-1.5 mb-[26px] text-center text-sm text-muted-foreground">
          Connecte-toi avec ton compte The Elsassisch.
        </p>

        <form onSubmit={soumettre} className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-foreground">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@example.com"
              required
              className="h-[46px] w-full rounded-sm border border-neutre-300 px-3 text-base text-foreground outline-none placeholder:text-neutre-400 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="motDePasse" className="mb-1.5 block text-[13px] font-semibold text-foreground">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              type="password"
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              className="h-[46px] w-full rounded-sm border border-neutre-300 px-3 text-base text-foreground outline-none placeholder:text-neutre-400 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={enCours}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-marque-rouge-500 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-50"
          >
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
            Se connecter
          </button>
        </form>

        <p className="my-4 text-center text-xs text-neutre-400">ou</p>

        <a
          href={URL_INSCRIPTION_ODOO}
          className="flex h-12 w-full items-center justify-center rounded-lg border border-bordure-forte text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
        >
          Créer un compte
        </a>

        <p className="mt-6 text-center text-xs text-neutre-400">
          En continuant, tu acceptes nos conditions.
        </p>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { signInWithOdooAction } from "@/app/actions/odoo-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const MESSAGES_ERREUR: Record<string, string> = {
  lien_invalide: "Ce lien est incomplet ou malformé.",
  lien_expire: "Ce lien a expiré ou a déjà été utilisé.",
};

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  // Permet d'entrer dans le dico avec un mot de passe Supabase si Odoo est
  // injoignable. Lu depuis l'URL plutôt que via useSearchParams, qui
  // imposerait une frontière Suspense au prérendu.
  const [modeSecours, setModeSecours] = useState(false);

  useEffect(() => {
    const motif = new URLSearchParams(window.location.search).get("erreur");
    if (motif) {
      toast.error(MESSAGES_ERREUR[motif] ?? "Lien invalide.");
    }
  }, []);

  const soumettre = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    setEnCours(true);

    if (modeSecours) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      setEnCours(false);
      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      const donnees = new FormData();
      donnees.set("email", email);
      donnees.set("password", motDePasse);
      const resultat = await signInWithOdooAction(donnees);
      setEnCours(false);
      if (!resultat.success) {
        toast.error(resultat.error);
        return;
      }
    }

    // Navigation complète volontaire : la session vient d'être posée en
    // cookies côté serveur, et AuthProvider ne la relit qu'au montage.
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            {modeSecours
              ? "Connexion de secours par mot de passe du dictionnaire."
              : "Utilisez vos identifiants The Elsassisch."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={soumettre} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motDePasse">Mot de passe</Label>
              <Input
                id="motDePasse"
                type="password"
                autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={enCours}>
              {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setModeSecours((actuel) => !actuel)}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {modeSecours
              ? "Revenir à la connexion The Elsassisch"
              : "Connexion de secours"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

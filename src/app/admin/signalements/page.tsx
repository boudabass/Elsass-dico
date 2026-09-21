"use client";

import Link from "next/link";
import { CheckCircle2, Flag } from "lucide-react";
import { toast } from "sonner";

import { listerSignalementsAction, traiterSignalementAction } from "@/app/actions/signalements";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListeAdmin } from "@/hooks/use-liste-admin";
import type { SignalementListe } from "@/lib/signalements";

// Deuxième des trois écrans admin du doc 20 (« Admin, trois écrans : membres,
// file des signalements, gestion des sources »). La file ne montre que les
// signalements non traités — un signalement traité quitte l'écran, comme
// « Recoupées (0) » quittait l'ancienne file d'arbitrage une fois publié : un
// écran vide ici est un succès, pas une panne.
//
// Marquer traité ne touche ni la forme ni ses témoins : la décision de fond
// (garder, corriger, masquer la variante) est un geste séparé, pris ailleurs.
// Cet écran est une file, pas un exécuteur.

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminSignalementsPage() {
  const { estAdmin, items: signalements, premierChargement, rafraichir } = useListeAdmin<SignalementListe>(
    "admin-signalements",
    async () => {
      const res = await listerSignalementsAction();
      return res.succes ? { succes: true, liste: res.signalements } : res;
    },
  );

  if (!estAdmin) return <div className="p-8 text-center">Accès refusé</div>;

  const traiter = async (id: string) => {
    const res = await traiterSignalementAction(id);
    if (res.succes) {
      toast.success(res.message);
      rafraichir();
    } else {
      toast.error(res.erreur);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader variant="stack" titre="Signalements" backHref="/admin" actif="admin" />

      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" /> À traiter ({signalements.length})
            </CardTitle>
            <CardDescription>
              Un membre a signalé une forme précise. Rien n&apos;a changé : à
              toi de juger, puis de marquer traité.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {premierChargement ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Chargement…</p>
            ) : signalements.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucun signalement en attente.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {signalements.map((s) => (
                  <li key={s.id} className="rounded-lg border border-border p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/entree/${s.lemme.id}`}
                          className="font-semibold text-foreground underline-offset-4 hover:underline"
                        >
                          {s.lemme.francais} → {s.variante.forme}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.membre.nom ?? s.membre.email} · {dateCourte(s.creeLe)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => traiter(s.id)}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-neutre-100 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-neutre-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Marquer traité
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{s.motif}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

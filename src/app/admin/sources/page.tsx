"use client";

import { Library } from "lucide-react";

import { listerSourcesAction } from "@/app/actions/sources";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListeAdmin } from "@/hooks/use-liste-admin";
import type { SourceListe } from "@/lib/sources";

// Troisième et dernier des trois écrans admin du doc 20. `Source` est de
// l'archive (« LECTURE SEULE » dans le schéma) : cet écran donne à voir la
// licence et la fiabilité déclarées de chaque source, il ne les modifie pas —
// elles viennent des fiches versionnées de `data/sources/`, pas de l'app.

export default function AdminSourcesPage() {
  const { estAdmin, items: sources, premierChargement } = useListeAdmin<SourceListe>(
    "admin-sources",
    async () => {
      const res = await listerSourcesAction();
      return res.succes ? { succes: true, liste: res.sources } : res;
    },
  );

  if (!estAdmin) return <div className="p-8 text-center">Accès refusé</div>;

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
      <AppHeader variant="stack" titre="Sources" backHref="/admin" actif="admin" />

      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" /> Sources écrites ({sources.length})
            </CardTitle>
            <CardDescription>
              L&apos;archive dont dérive le dictionnaire. Elle est en lecture
              seule : elle se régénère depuis <code>data/sources/</code>, pas
              depuis cet écran.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {premierChargement ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Chargement…</p>
            ) : sources.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Aucune source.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted">
                    <tr>
                      <th className="p-3 font-semibold">Source</th>
                      <th className="hidden p-3 font-semibold md:table-cell">Licence</th>
                      <th className="p-3 font-semibold text-right">Fiabilité</th>
                      <th className="hidden p-3 font-semibold text-right md:table-cell">Attestations</th>
                      <th className="p-3 font-semibold text-right">Témoignages</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sources.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/60">
                        <td className="p-3">
                          {s.url ? (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium underline-offset-4 hover:underline"
                            >
                              {s.nom}
                            </a>
                          ) : (
                            <span className="font-medium">{s.nom}</span>
                          )}
                          <span className="block text-xs text-muted-foreground">
                            {s.code}
                            {s.annee ? ` · ${s.annee}` : ""}
                          </span>
                        </td>
                        <td className="hidden p-3 md:table-cell">{s.licence ?? "Non déclarée"}</td>
                        <td className="p-3 text-right tabular-nums">{s.fiabilite}</td>
                        <td className="hidden p-3 text-right tabular-nums md:table-cell">{s.nbAttestations}</td>
                        <td className="p-3 text-right tabular-nums">{s.nbTemoignages}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

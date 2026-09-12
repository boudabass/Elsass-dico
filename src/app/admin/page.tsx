"use client";

import { RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

import { changerRoleAction, listerMembresAction } from "@/app/actions/membres";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListeMemorisee } from "@/hooks/use-liste-memorisee";
import { cleCache } from "@/lib/cache-navigation";
import { LIBELLES_ROLE, ROLES, type MembreListe } from "@/lib/membres";

// Écran des membres. Réécrit le 12/09/2026 : il pilotait l'annuaire
// `auth.users` de Supabase et proposait trois gestes qui n'existent plus —
// inviter (les comptes se créent sur le portail Odoo), générer un lien de
// réinitialisation (Odoo est l'autorité sur les mots de passe), supprimer un
// compte (les témoignages d'un membre sont en cascade : l'effacer effacerait des
// villages que personne d'autre ne porte).
//
// Reste ce qui décide de quelque chose : voir qui est là, et changer un rôle.

function dateCourte(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminPage() {
  const { session, role } = useAuth();
  const estAdmin = Boolean(session) && role === "admin";

  const {
    donnees: membresCharges,
    premierChargement,
    rafraichir,
  } = useListeMemorisee<MembreListe[]>({
    cle: estAdmin ? cleCache("admin-membres", session!.membreId) : null,
    charger: async () => {
      const res = await listerMembresAction();
      if (!res.succes) {
        toast.error(res.erreur);
        return [];
      }
      return res.membres;
    },
  });

  const membres = membresCharges ?? [];

  // Le middleware redirige déjà un non-admin ; ce garde-fou n'est là que pour le
  // cas où il serait contourné. La vraie barrière est côté serveur —
  // `adminExige()` relit le rôle en base à chaque action.
  if (!estAdmin) return <div className="p-8 text-center">Accès refusé</div>;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        variant="stack"
        titre="Administration"
        backHref="/dashboard"
        actif="admin"
        trailing={
          <button
            type="button"
            onClick={rafraichir}
            aria-label="Actualiser"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutre-100 text-foreground"
          >
            <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        }
      />

      <div className="container mx-auto max-w-5xl space-y-8 p-4 pb-16 md:p-8 md:pb-8 md:pl-20 lg:pl-56">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Membres ({membres.length})
            </CardTitle>
            <CardDescription>
              Un membre apparaît ici à sa première connexion. Les comptes se
              créent sur le portail The Elsassisch, qui reste l&apos;autorité sur
              les identifiants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {premierChargement ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Chargement…</p>
            ) : membres.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucun membre pour l&apos;instant.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted">
                    <tr>
                      <th className="p-3 font-semibold">Membre</th>
                      <th className="p-3 font-semibold">Village</th>
                      <th className="p-3 font-semibold text-right">Témoignages</th>
                      <th className="p-3 font-semibold">Vu le</th>
                      <th className="p-3 font-semibold">Rôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {membres.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/60">
                        <td className="p-3">
                          <span className="block font-medium">{m.nom ?? m.email}</span>
                          {m.nom && (
                            <span className="block text-xs text-muted-foreground">{m.email}</span>
                          )}
                        </td>
                        <td className="p-3">{m.village ?? "—"}</td>
                        {/* Des témoignages, jamais « des contributions » ni un
                            total mêlé de sources : ce chiffre compte ce que ce
                            membre a attaché à des formes, rien d'autre. */}
                        <td className="p-3 text-right tabular-nums">{m.nbTemoignages}</td>
                        <td className="p-3 whitespace-nowrap">{dateCourte(m.vuLe)}</td>
                        <td className="p-3">
                          <Select
                            value={m.role}
                            onValueChange={async (nouveau) => {
                              if (nouveau === m.role) return;
                              const res = await changerRoleAction(m.id, nouveau);
                              if (res.succes) {
                                toast.success(res.message);
                                rafraichir();
                              } else {
                                toast.error(res.erreur);
                              }
                            }}
                          >
                            <SelectTrigger className="w-44" aria-label={`Rôle de ${m.email}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {LIBELLES_ROLE[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
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

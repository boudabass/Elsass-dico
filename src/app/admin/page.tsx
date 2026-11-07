"use client";

import Link from "next/link";
import { BookPlus, Flag, Library, ListChecks, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

import { changerRoleAction, definirBlocageAction, listerMembresAction } from "@/app/actions/membres";
import { AppHeader } from "@/components/app-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListeAdmin } from "@/hooks/use-liste-admin";
import { LIBELLES_ROLE, ROLES, type MembreListe } from "@/lib/membres";

// Écran des membres. Réécrit le 12/09/2026 : il pilotait l'annuaire
// `auth.users` de Supabase et proposait trois gestes qui n'existent plus —
// inviter (les comptes se créent sur le portail Odoo), générer un lien de
// réinitialisation (Odoo est l'autorité sur les mots de passe), supprimer un
// compte (les témoignages d'un membre sont en cascade : l'effacer effacerait des
// villages que personne d'autre ne porte).
//
// Reste ce qui décide de quelque chose : voir qui est là, et changer un rôle.

// Date à la main : `toLocaleDateString` ne donne pas la même barre oblique selon
// les navigateurs (et `toLocaleString` met une espace fine que la police ne dessine pas).
function dateCourte(iso: string | null): string {
  if (!iso) return "Inconnu";
  const d = new Date(iso);
  const jour = String(d.getDate()).padStart(2, "0");
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  return `${jour}/${mois}/${d.getFullYear()}`;
}

function BoutonBlocage({ membre, onFait }: { membre: MembreListe; onFait: () => void }) {
  const estBloque = membre.bloqueLe !== null;
  const nom = membre.nom ?? membre.email;

  async function basculer() {
    const res = await definirBlocageAction(membre.id, !estBloque);
    if (res.succes) {
      toast.success(res.message);
      onFait();
    } else {
      toast.error(res.erreur);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={estBloque ? "outline" : "destructive"}
          size="sm"
          className="mt-2 h-auto min-h-11 whitespace-normal"
        >
          {estBloque ? "Débloquer" : "Bloquer"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {estBloque ? `Débloquer ${nom} ?` : `Bloquer ${nom} ?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {estBloque
              ? "Son compte pourra de nouveau ajouter et modifier."
              : "Son compte pourra encore lire le dictionnaire et faire le défi, mais il ne pourra plus rien ajouter ni modifier. Rien de ce qu'il a écrit n'est effacé."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={basculer}>
            {estBloque ? "Débloquer" : "Bloquer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminPage() {
  const { estAdmin, items: membres, premierChargement, rafraichir } = useListeAdmin<MembreListe>(
    "admin-membres",
    async () => {
      const res = await listerMembresAction();
      return res.succes ? { succes: true, liste: res.membres } : res;
    },
  );

  // Le middleware redirige déjà un non-admin ; ce garde-fou n'est là que pour le
  // cas où il serait contourné. La vraie barrière est côté serveur —
  // `adminExige()` relit le rôle en base à chaque action.
  if (!estAdmin) return <div className="p-8 text-center">Accès refusé</div>;

  return (
    <div className="flex min-h-ecran flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
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

      <div className="space-y-8 p-4 pb-8 md:p-8">
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/signalements"
            className="flex h-10 items-center gap-1.5 rounded-full border border-bordure-forte px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
          >
            <Flag className="h-4 w-4" strokeWidth={2} />
            Signalements
          </Link>
          <Link
            href="/admin/sources"
            className="flex h-10 items-center gap-1.5 rounded-full border border-bordure-forte px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
          >
            <Library className="h-4 w-4" strokeWidth={2} />
            Sources
          </Link>
          <Link
            href="/admin/mots"
            className="flex h-10 items-center gap-1.5 rounded-full border border-bordure-forte px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
          >
            <BookPlus className="h-4 w-4" strokeWidth={2} />
            Mots ajoutés
          </Link>
          <Link
            href="/admin/contributions"
            className="flex h-10 items-center gap-1.5 rounded-full border border-bordure-forte px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
          >
            <ListChecks className="h-4 w-4" strokeWidth={2} />
            Contributions
          </Link>
        </div>

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
                      <th className="hidden p-3 font-semibold md:table-cell">Village</th>
                      <th className="p-3 font-semibold text-right">Témoignages</th>
                      <th className="hidden p-3 font-semibold md:table-cell">Vu le</th>
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
                          {m.nomsAnterieurs.length > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              Anciens noms : {m.nomsAnterieurs.map((n) => `${n.nom} (${dateCourte(n.le)})`).join(" · ")}
                            </span>
                          )}
                          {m.bloqueLe && (
                            <span className="block text-xs font-semibold text-destructive">
                              Bloqué depuis le {dateCourte(m.bloqueLe)}
                            </span>
                          )}
                          {/* Un admin ne se bloque pas lui-même, ni un autre admin :
                              le serveur le refuse aussi. */}
                          {!m.estMoi && (m.role !== "admin" || m.bloqueLe) && (
                            <BoutonBlocage membre={m} onFait={rafraichir} />
                          )}
                        </td>
                        <td className="hidden p-3 md:table-cell">{m.village ?? "Aucun"}</td>
                        {/* Des témoignages, jamais « des contributions » ni un
                            total mêlé de sources : ce chiffre compte ce que ce
                            membre a attaché à des formes, rien d'autre. */}
                        <td className="p-3 text-right tabular-nums">{m.nbTemoignages}</td>
                        <td className="hidden p-3 whitespace-nowrap md:table-cell">{dateCourte(m.vuLe)}</td>
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

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  getUsersAction,
  inviteUserAction,
  deleteUserAction,
  updateUserRoleAction,
  generateRecoveryLinkAction
} from "@/app/actions/user-management";
import { User } from "@supabase/supabase-js";
import { Trash2, Users, UserPlus, Loader2, Copy, KeyRound } from "lucide-react";
import { ROLES_AUTORISES, LIBELLES_ROLE } from "@/lib/roles";

export default function AdminPage() {
  const { user, role, isLoading } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  // Tant que le SMTP n'est pas configuré, le lien est affiché ici pour que
  // l'administrateur le transmette lui-même au destinataire.
  const [lienGenere, setLienGenere] = useState<{ email: string; url: string } | null>(null);

  const copierLien = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible, sélectionnez le lien manuellement");
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    setIsUsersLoading(true);
    const res = await getUsersAction();
    if (res.success && res.users) {
      setUsersList(res.users);
    }
    setIsUsersLoading(false);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user || role !== 'admin') return <div className="p-8 text-center">Accès refusé</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Administration</h1>
        <Button variant="outline" onClick={refreshUsers}>Actualiser</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Inviter un Utilisateur
          </CardTitle>
          <CardDescription>
            Le compte est créé sans mot de passe : transmettez le lien généré au destinataire,
            qui choisira lui-même son mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={async (formData) => {
            const email = formData.get("email") as string;
            const res = await inviteUserAction(formData);
            if (res.success) {
              toast.success(res.message);
              setLienGenere({ email, url: res.lien });
              refreshUsers();
            } else {
              toast.error(res.error);
            }
          }} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="email@exemple.com" required />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES_AUTORISES.map((role) => (
                    <SelectItem key={role} value={role}>{LIBELLES_ROLE[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Inviter</Button>
          </form>
        </CardContent>
      </Card>

      {lienGenere && (
        <div className="rounded-md border bg-muted/40 p-4 space-y-2">
          <p className="text-sm font-medium">
            Lien à transmettre à {lienGenere.email}
          </p>
          <div className="flex gap-2">
            <Input readOnly value={lienGenere.url} className="font-mono text-xs" />
            <Button type="button" variant="outline" onClick={() => copierLien(lienGenere.url)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ce lien est à usage unique et expire. Il ne sera plus affiché après avoir quitté
            cette page.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <p className="text-center py-4">Chargement...</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Rôle</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usersList.map((u: any) => {
                    const currentRole = u.profile_role || "user";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                          <Select
                            value={currentRole}
                            onValueChange={async (nouveauRole) => {
                              if (nouveauRole === currentRole) return;
                              const res = await updateUserRoleAction(u.id, nouveauRole);
                              if (res.success) { toast.success(res.message); refreshUsers(); }
                              else { toast.error(res.error); }
                            }}
                          >
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLES_AUTORISES.map((role) => (
                                <SelectItem key={role} value={role}>{LIBELLES_ROLE[role]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button variant="outline" size="sm" title="Générer un lien de réinitialisation" onClick={async () => {
                            const res = await generateRecoveryLinkAction(u.email!);
                            if (res.success) {
                              toast.success(res.message);
                              setLienGenere({ email: u.email!, url: res.lien });
                            } else { toast.error(res.error); }
                          }}><KeyRound className="w-4 h-4" /></Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (confirm(`Supprimer ${u.email} ?`)) {
                              const res = await deleteUserAction(u.id);
                              if (res.success) { toast.success(res.message); refreshUsers(); }
                              else { toast.error(res.error); }
                            }
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
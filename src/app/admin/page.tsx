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
  createUserAction,
  deleteUserAction,
  updateUserRoleAction
} from "@/app/actions/user-management";
import { User } from "@supabase/supabase-js";
import { Trash2, Users, UserPlus, Shield, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

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
  if (!user) return <div className="p-8 text-center">Accès refusé</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Administration</h1>
        <Button variant="outline" onClick={refreshUsers}>Actualiser</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Créer un Utilisateur
          </CardTitle>
          <CardDescription>Ajouter manuellement un accès à la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            const res = await createUserAction(formData);
            if (res.success) {
              toast.success(res.message);
              refreshUsers();
            } else {
              toast.error(res.error);
            }
          }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="email@exemple.com" required />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input name="password" type="password" placeholder="******" required />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Créer</Button>
          </form>
        </CardContent>
      </Card>

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
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${currentRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {currentRole === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {currentRole}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={async () => {
                            const newRole = currentRole === 'admin' ? 'user' : 'admin';
                            const res = await updateUserRoleAction(u.id, newRole);
                            if (res.success) { toast.success(res.message); refreshUsers(); }
                          }}>Rôle</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (confirm(`Supprimer ${u.email} ?`)) {
                              const res = await deleteUserAction(u.id);
                              if (res.success) { toast.success(res.message); refreshUsers(); }
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
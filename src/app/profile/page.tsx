"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Shield, Calendar } from "lucide-react";

export default function ProfilePage() {
    const { user, role, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center">Veuillez vous connecter pour voir votre profil.</div>;
    }

    const email = user.email || "";
    const initials = email.substring(0, 2).toUpperCase();
    const joinDate = new Date(user.created_at || Date.now()).toLocaleDateString("fr-FR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>
            
            <div className="grid gap-6 md:grid-cols-3">
                {/* Carte d'identité */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle className="truncate">{email}</CardTitle>
                        <CardDescription>
                            <Badge variant={role === 'admin' ? "default" : "secondary"} className="mt-2">
                                {role || "Utilisateur"}
                            </Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-2 h-4 w-4" />
                            <span className="truncate">{email}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Inscrit le {joinDate}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>ID: {user.id.substring(0, 8)}...</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Contenu principal */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informations personnelles</CardTitle>
                        <CardDescription>
                            Gérez vos informations et préférences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium">Paramètres du compte</h3>
                            <p className="text-sm text-muted-foreground">
                                Pour modifier votre mot de passe ou supprimer votre compte, veuillez contacter un administrateur.
                            </p>
                        </div>
                        
                        <div className="rounded-md border p-4 bg-muted/50">
                            <h4 className="mb-2 font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Zone sécurisée
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Ceci est un exemple de section protégée accessible uniquement aux utilisateurs authentifiés.
                            </p>
                            <Button variant="outline" size="sm">
                                Action utilisateur
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
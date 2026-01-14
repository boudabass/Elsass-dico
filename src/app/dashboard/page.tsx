"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Settings, FileCode, Shield } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { user, role, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 flex justify-center">Chargement...</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Bienvenue sur votre espace personnel, {user?.email}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Statut du compte</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{role || "User"}</div>
                        <p className="text-xs text-muted-foreground">
                            Rôle actuel
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dernière connexion</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Aujourd'hui</div>
                        <p className="text-xs text-muted-foreground">
                            Session active
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Vue d'ensemble</CardTitle>
                        <CardDescription>
                            Votre activité récente sur la plateforme.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                       <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                            Contenu principal de votre application
                       </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Actions Rapides</CardTitle>
                        <CardDescription>
                            Raccourcis vers les fonctionnalités clés.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link href="/profile" className="block">
                            <Button variant="outline" className="w-full justify-start">
                                <User className="mr-2 h-4 w-4" />
                                Gérer mon profil
                            </Button>
                        </Link>
                        {role === 'admin' && (
                            <Link href="/admin" className="block">
                                <Button variant="outline" className="w-full justify-start border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Panneau d'administration
                                </Button>
                            </Link>
                        )}
                        <Button variant="ghost" className="w-full justify-start" disabled>
                            <FileCode className="mr-2 h-4 w-4" />
                            Documentation (Bientôt)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
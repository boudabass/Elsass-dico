"use client";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User, Shield, Trophy } from "lucide-react";

export function UserNav() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh(); // Rafraîchir pour mettre à jour le middleware/cookies
    };

    if (isLoading) return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200"></div>;

    if (!user) {
        return (
            <Link href="/login">
                <Button variant="outline" size="sm">Se connecter</Button>
            </Link>
        );
    }

    // Initials
    const email = user.email || "U";
    const initials = email.substring(0, 2).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={email} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Mon Compte</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Mon Profil</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                            <Trophy className="mr-2 h-4 w-4" />
                            <span>Mes Scores</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                {/* Lien Admin si nécessaire (vérification simple, vrai check coté serveur) */}
                <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Languages, LayoutDashboard, PenLine } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();
    const { user, role } = useAuth();
    const estContributeur = role === "contributeur" || role === "admin";

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            <Link
                href={user ? "/dashboard" : "/"}
                className="flex items-center gap-2 font-bold text-lg mr-4 text-primary hover:opacity-80 transition-opacity"
            >
                <Languages className="w-6 h-6 text-indigo-500" /> Elsass Dico
            </Link>

            {user && (
                <>
                    <Link
                        href="/dashboard"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                            pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    {estContributeur && (
                        <Link
                            href="/contributions"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                                pathname === "/contributions" ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            <PenLine className="w-4 h-4" /> Contributions
                        </Link>
                    )}
                    <Link
                        href="/profile"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary",
                            pathname === "/profile" ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        Mon Profil
                    </Link>
                </>
            )}
        </nav>
    );
}
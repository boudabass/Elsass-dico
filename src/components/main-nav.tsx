"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Rocket, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            <Link
                href={user ? "/dashboard" : "/"}
                className="flex items-center gap-2 font-bold text-lg mr-4 text-primary hover:opacity-80 transition-opacity"
            >
                <Rocket className="w-6 h-6 text-indigo-500" /> AppTemplate
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
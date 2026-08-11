"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // L'accueil a son propre bandeau sombre plein cadre (voir src/app/page.tsx) :
    // le header clair générique flotterait au-dessus en laissant une bande
    // blanche visible, d'autant plus voyant une fois intégré en iframe dans
    // The Elsassisch, qui a déjà sa propre navigation.
    const hideHeader = pathname === "/";

    return (
        <div className="flex-col md:flex min-h-screen">
            {!hideHeader && (
                <div className="border-b">
                    <div className="flex h-16 items-center px-4 container mx-auto">
                        <MainNav className="mx-6" />
                        <div className="ml-auto flex items-center space-x-4">
                            <UserNav />
                        </div>
                    </div>
                </div>
            )}

            <main className={cn("flex-1", !hideHeader && "space-y-4 p-8 pt-6")}>
                {children}
            </main>
        </div>
    );
}
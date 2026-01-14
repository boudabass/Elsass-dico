"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Logic to hide header on specific pages if needed
    const hideHeader = false; 

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
            
            <main className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </main>
        </div>
    );
}
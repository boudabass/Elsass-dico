"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Accueil
      </Link>
      <Link
        href="/games"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          // FIX: Check for pathname nullability
          pathname && pathname.startsWith("/games") ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Catalogue
      </Link>
      <Link
        href="/admin"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname && pathname.startsWith("/admin") ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Admin
      </Link>
    </nav>
  );
}
"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  // FIX: Check if pathname is not null before calling startsWith
  const isGamePage = pathname ? pathname.startsWith("/play/") : false;

  return (
    <>
      {!isGamePage && <Header />}
      <main className={isGamePage ? "h-screen w-screen" : "flex-1"}>
        {children}
      </main>
      <Toaster />
    </>
  );
}
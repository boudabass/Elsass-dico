import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Game Center Seniors",
  description: "Plateforme de jeux accessible pour seniors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="flex-col md:flex min-h-screen">
            <div className="border-b">
              <div className="flex h-16 items-center px-4 container mx-auto">
                <MainNav className="mx-6" />
                <div className="ml-auto flex items-center space-x-4">
                  <UserNav />
                </div>
              </div>
            </div>
            <main className="flex-1 space-y-4 p-8 pt-6">
              {children}
            </main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
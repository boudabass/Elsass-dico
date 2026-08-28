import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";

// Corps de texte : Archivo, adoptée le 28/08/2026 (design system « The
// Elsassisch Design Systeme ») en remplacement de la pile système mesurée
// sur le site réel — choix délibéré de modernisation, pas une extraction.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

// Titres : Azimut, police réellement utilisée par le site pour le logotype.
// À noter : ce n'est pas un asset exclusif à la marque — Azimut est une
// police commandée par la Ville de Strasbourg (Capitale mondiale du livre
// Unesco 2024), sous licence CC BY-ND 4.0 (attribution requise, pas de
// modification). Un crédit reste à poser quelque part dans l'app (footer ?).
const azimut = localFont({
  src: "./fonts/Azimut-Regular.otf",
  variable: "--font-azimut",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elsass Dico — Traducteur français-alsacien",
  description:
    "Dictionnaire français-alsacien construit par recoupement de sources indépendantes, en graphie ORTHAL. Un projet de The Elsassisch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${archivo.variable} ${azimut.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
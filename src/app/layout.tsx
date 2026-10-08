import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { InverseurSens } from "@/components/inverseur-sens";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { SensProvider } from "@/components/sens-provider";
import { COOKIE_SENS, lireSens } from "@/lib/sens";
import { sessionActuelle } from "@/lib/session-serveur";
import { cookies } from "next/headers";

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
  title: "Elsass Dico · Dictionnaire français-alsacien",
  description:
    "Le français-alsacien, village par village : tiré de sources écrites et des Alsaciens qui le parlent, jamais une traduction inventée. Un projet de The Elsassisch.",
};

// La session est lue ICI, côté serveur, à partir du cookie signé — et passée
// au provider. C'est ce qui permet à `AuthProvider` de n'émettre aucune requête
// (cf. le commentaire en tête de ce fichier-là).
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await sessionActuelle();
  // Le sens est lu ici, comme la session, pour que <html> porte la bonne
  // couleur dès le premier octet (cf. sens-provider.tsx).
  const sens = lireSens((await cookies()).get(COOKIE_SENS)?.value);

  return (
    <html
      lang="fr"
      data-sens={sens}
      // L'inverseur n'existe que pour un membre : sans lui, aucune place
      // n'est réservée en haut (--hauteur-inverseur, globals.css).
      data-inverseur={session ? "" : undefined}
      suppressHydrationWarning
    >
      <body
        className={`${archivo.variable} ${azimut.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider session={session}>
          <SensProvider sensInitial={sens}>
            {session && <InverseurSens />}
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster />
          </SensProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
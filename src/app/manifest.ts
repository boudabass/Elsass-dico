import type { MetadataRoute } from "next";

// Manifeste de l'app installée sur l'écran d'accueil (27/09/2026). Sans lui,
// un téléphone prenait le favicon par défaut de Next comme icône. Icônes
// générées par `scripts/marque/generer-icones.py`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elsass Dico",
    short_name: "Elsass Dico",
    description: "Le français-alsacien, village par village.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

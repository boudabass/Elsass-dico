import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produit .next/standalone : un serveur autonome n'embarquant que les
  // dépendances réellement tracées. L'image de production n'a alors plus à
  // recopier node_modules en entier, ce qui saturait le disque du VPS et
  // finissait par faire échouer les déploiements.
  output: "standalone",
  // Durée pendant laquelle un retour arrière réutilise la charge RSC déjà
  // reçue au lieu de la redemander. La valeur par défaut de Next 15 est 0
  // pour les routes dynamiques : /entree/[id] lit des cookies (la session),
  // donc chaque retour vers une fiche déjà vue refaisait la requête. C'est le
  // SEUL levier pour ces pages : ce sont des Server Components, aucun cache
  // client ne peut les couvrir.
  //
  // L'économie était plus grosse encore avant le 12/09/2026, quand chaque
  // requête traversait un middleware qui appelait `supabase.auth.getUser()` par
  // le réseau plus un select sur `profiles`. Le middleware ne fait plus aucun
  // I/O ; ce réglage garde sa raison d'être, une de moins.
  // `static` reste au défaut (300 s), il n'y avait rien à y gagner.
  // Contrepartie : une entrée modifiée peut mettre jusqu'à 30 s à se
  // rafraîchir sur un retour. Acceptable pour un dictionnaire, où les entrées
  // publiées ne bougent presque jamais.
  experimental: {
    staleTimes: { dynamic: 30 },
  },
  webpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: "@dyad-sh/nextjs-webpack-component-tagger",
      });
    }
    return config;
  },
  async rewrites() {
    const rewrites = [];

    // Proxy API externe pour contourner les CORS (si nécessaire)
    const externalApiUrl = process.env.EXTERNAL_API_URL;

    if (externalApiUrl) {
      rewrites.push({
        source: '/api/proxy/:path*',
        destination: `${externalApiUrl}/:path*`,
      });
    }

    return rewrites;
  },
};

export default nextConfig;
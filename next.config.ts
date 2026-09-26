import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produit .next/standalone : un serveur autonome n'embarquant que les
  // dépendances réellement tracées. L'image de production n'a alors plus à
  // recopier node_modules en entier, ce qui saturait le disque du VPS et
  // finissait par faire échouer les déploiements.
  output: "standalone",
  // La police de l'image de partage est lue sur le disque à l'exécution : le
  // traçage ne la voit pas, sans cette ligne elle manquerait dans l'image.
  outputFileTracingIncludes: {
    "/api/partage/defi": ["./src/assets/polices/*.woff", "./src/assets/marque/signature.png"],
  },
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
    // Un seul worker pour générer les pages statiques (13/09/2026). Le build
    // Coolify est mort en silence — pas d'erreur, juste un arrêt net à
    // « Generating static pages (240/963) », exit 255 sur le process
    // englobant : la signature d'un SIGKILL, pas d'une exception applicative.
    // Cause probable : Next fait tourner N pages en parallèle par défaut (N
    // proche du nombre de cœurs), et /village + /prenom (950 des 963 pages)
    // ouvrent chacune une vraie requête Postgres via generateStaticParams —
    // plusieurs dizaines de connexions et de processus Node simultanés sur un
    // VPS déjà connu pour saturer (audit du 30/08/2026, CLAUDE.md). `cpus: 1`
    // sérialise la génération : plus lent, mais un seul processus à la fois.
    // Non confirmé par une métrique mémoire (accès Sentinel hors de portée
    // d'ici) — à retirer si une autre cause se confirme.
    cpus: 1,
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
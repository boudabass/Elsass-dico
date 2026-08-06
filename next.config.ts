import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produit .next/standalone : un serveur autonome n'embarquant que les
  // dépendances réellement tracées. L'image de production n'a alors plus à
  // recopier node_modules en entier, ce qui saturait le disque du VPS et
  // finissait par faire échouer les déploiements.
  output: "standalone",
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
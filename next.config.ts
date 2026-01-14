import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

    // Exemple de Proxy API externe pour contourner les CORS
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
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'got' module on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        got: false,
      };
    }
    return config;
  },
};

export default nextConfig;

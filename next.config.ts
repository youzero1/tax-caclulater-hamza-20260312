import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['typeorm', 'better-sqlite3'],
  experimental: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('better-sqlite3', 'typeorm');
      }
    }
    return config;
  },
};

export default nextConfig;

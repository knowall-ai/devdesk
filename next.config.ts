import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output for Azure App Service deployment
  // Creates a self-contained build with all dependencies bundled
  output: 'standalone',
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Domain packages are consumed as TypeScript source (Technical Constitution §2);
  // Next transpiles them for the app build while they stay framework-free.
  transpilePackages: ['@senstar/config', '@senstar/db', '@senstar/domain-identity'],
};

export default nextConfig;

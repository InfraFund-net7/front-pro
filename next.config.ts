import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensures ESM/interop for ConnectKit’s React.lazy() chunks so the first
  // click inside the modal does not hit an undefined `default` export.
  transpilePackages: ['@particle-network/connectkit'],
};

export default nextConfig;

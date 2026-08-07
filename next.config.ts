import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import packageJson from './package.json';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const OPTIONAL_PEERS =
  /^(?:@react-native-async-storage\/async-storage|pino-pretty|encoding|lokijs)$/;
const gitSha = process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 7) ?? 'local';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_GIT_SHA: gitSha,
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'Referrer-Policy', value: 'origin' }],
      },
    ];
  },
  outputFileTracingRoot: projectRoot,
  turbopack: {
    resolveAlias: {
      '@solana/kit': './src/lib/solana-kit-unavailable.ts',
      '@solana-program/system': './src/lib/solana-kit-unavailable.ts',
    },
  },
  webpack: (config, { webpack }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@solana/kit': path.join(
        projectRoot,
        'src/lib/solana-kit-unavailable.ts'
      ),
      '@solana-program/system': path.join(
        projectRoot,
        'src/lib/solana-kit-unavailable.ts'
      ),
    };
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: OPTIONAL_PEERS,
      })
    );
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});

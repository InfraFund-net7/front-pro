import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const OPTIONAL_PEERS =
  /^(?:@react-native-async-storage\/async-storage|pino-pretty|encoding|lokijs)$/;

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: projectRoot,
  webpack: (config, { webpack }) => {
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

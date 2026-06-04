import path from 'node:path';
import type { NextConfig } from 'next';

/** Resolves the same module OpenfortProvider lazy-loads, so webpack can preload/dedupe the chunk. */
const openfortConnectModalEntry = path.join(
  process.cwd(),
  'node_modules/@openfort/react/build/components/ConnectModal/index.js'
);

const poweredByReplacement = path.join(
  process.cwd(),
  'src/components/openfort/infra-powered-by-footer.tsx'
);

const openfortUiContextEntry = path.join(
  process.cwd(),
  'node_modules/@openfort/react/build/components/Openfort/useOpenfort.js'
);

const landingLegalUrlsEntry = path.join(
  process.cwd(),
  'src/lib/landing-legal-urls.ts'
);

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@openfort/react', '@openfort/openfort-js'],
  webpack: (config, { webpack: webpackApi }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'openfort-internal-connect-modal': openfortConnectModalEntry,
      'openfort-ui-provider-context': openfortUiContextEntry,
      /** Absolute alias so imports inside webpack-replaced Openfort chunks resolve correctly. */
      'infrafund-landing-legal-urls': landingLegalUrlsEntry,
    };
    config.plugins.push(
      new webpackApi.NormalModuleReplacementPlugin(
        /[\\/]@openfort[\\/]react[\\/]build[\\/]components[\\/]Common[\\/]PoweredByFooter[\\/]index\.js$/,
        poweredByReplacement
      )
    );
    return config;
  },
};

export default nextConfig;

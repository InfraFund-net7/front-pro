import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

function withoutReactRules(configs) {
  return configs.map((config) => ({
    ...config,
    rules: Object.fromEntries(
      Object.entries(config.rules ?? {}).filter(
        ([ruleName]) => !ruleName.startsWith('react/')
      )
    ),
  }));
}

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'public/cesium/**',
      '.opencode/**',
      'next-env.d.ts',
      'eslint.config.mjs',
    ],
  },
  ...withoutReactRules(nextVitals),
  ...nextTypescript,
  {
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default eslintConfig;

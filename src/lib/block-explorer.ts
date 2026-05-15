import {
  base,
  baseSepolia,
  mainnet,
  polygon,
  sepolia,
  type Chain,
} from 'viem/chains';

// Chains we care about right now. Add more as needed.
// We rely on viem's bundled `blockExplorers.default.url` so we don't have to
// hand-maintain explorer URLs.
const KNOWN_CHAINS: readonly Chain[] = [
  base,
  baseSepolia,
  mainnet,
  polygon,
  sepolia,
];

export function getChainName(chainId: number | undefined): string | null {
  if (!chainId) return null;
  return KNOWN_CHAINS.find((c) => c.id === chainId)?.name ?? null;
}

export function getAddressExplorerUrl(
  chainId: number | undefined,
  address: string | undefined
): string | null {
  if (!chainId || !address) return null;
  const url = KNOWN_CHAINS.find((c) => c.id === chainId)?.blockExplorers
    ?.default?.url;
  return url ? `${url}/address/${address}` : null;
}

import {
  DEFAULT_MEE_VERSION,
  getMEEVersion,
  toNexusAccount,
} from '@biconomy/abstractjs';
import { http, type Address } from 'viem';
import type { ConnectedWallet } from '@privy-io/react-auth';
import { defaultChain } from '@/lib/app-providers';

export const smartAccountChain = defaultChain;

const addressCache = new Map<string, Promise<Address>>();

async function deriveSmartAccountAddress(
  wallet: ConnectedWallet
): Promise<Address> {
  const provider = await wallet.getEthereumProvider();

  const account = await toNexusAccount({
    signer: provider,
    chainConfiguration: {
      chain: smartAccountChain,
      transport: http(),
      version: getMEEVersion(DEFAULT_MEE_VERSION),
    },
  });

  return account.address;
}

/**
 * Derives the Biconomy Nexus smart-account address for a Privy embedded
 * wallet. The address is counterfactual (CREATE2-deterministic from the
 * signer + chain config), so it's safe to cache per wallet address for the
 * lifetime of the page — no network call is needed to recompute it.
 */
export function getSmartAccountAddress(
  wallet: ConnectedWallet
): Promise<Address> {
  const cached = addressCache.get(wallet.address);
  if (cached) return cached;

  const promise = deriveSmartAccountAddress(wallet);
  addressCache.set(wallet.address, promise);
  promise.catch(() => addressCache.delete(wallet.address));

  return promise;
}

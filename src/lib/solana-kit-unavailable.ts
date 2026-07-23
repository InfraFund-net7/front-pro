export function address(): never {
  throw new Error('Non-EVM wallet support is not enabled.');
}

export function createSolanaRpc(): never {
  throw new Error('Non-EVM wallet support is not enabled.');
}

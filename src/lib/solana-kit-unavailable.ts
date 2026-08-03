// Stub replacing '@solana/kit' (see next.config.ts's webpack/turbopack alias).
// This app is EVM-only; Solana support is intentionally not enabled. Several
// packages in the dependency tree (pulled in transitively via
// @privy-io/react-auth's Solana wallet support) statically import a much
// larger slice of '@solana/kit's API than this app will ever exercise.
//
// Two categories of export, handled differently:
// - Type-guard/predicate/branding/option helpers that generic, chain-agnostic
//   code may call just to ask "is this a Solana thing?" (answer: no) or to
//   build a harmless default config value. These must not throw, or they'd
//   break EVM-only flows that never touch Solana at all.
// - Actual Solana transaction-building/codec functions (encoders, decoders,
//   RPC calls, transaction compilation). These throw if ever really invoked,
//   since reaching them means something attempted a real Solana operation,
//   which is a genuine error for this app, not a benign capability check.

function unavailable(name: string): never {
  throw new Error(
    `Non-EVM wallet support is not enabled. ('@solana/kit' stub: ${name} is unimplemented)`
  );
}

// --- Safe, non-throwing: type guards (always "not a Solana thing") ---
export function isOption(): boolean {
  return false;
}
export function isNone(): boolean {
  return false;
}
export function isSolanaError(): boolean {
  return false;
}
export function isProgramError(): boolean {
  return false;
}
export function isTransactionSigner(): boolean {
  return false;
}
export function isTransactionModifyingSigner(): boolean {
  return false;
}
export function isTransactionPartialSigner(): boolean {
  return false;
}
export function isTransactionMessageWithDurableNonceLifetime(): boolean {
  return false;
}

// --- Safe, non-throwing: branding/option/error-class helpers ---
// mainnet()/devnet() just brand a URL string with a cluster type in the real
// SDK — identity at runtime, safe to no-op the same way.
export function mainnet<T>(value: T): T {
  return value;
}
export function devnet<T>(value: T): T {
  return value;
}
export function none(): { readonly __option: 'None' } {
  return { __option: 'None' } as const;
}
export class SolanaError extends Error {
  constructor(...args: unknown[]) {
    super(
      typeof args[0] === 'string'
        ? args[0]
        : 'Non-EVM wallet support is not enabled.'
    );
    this.name = 'SolanaError';
  }
}
export const AccountRole = Object.freeze({
  READONLY: 0,
  WRITABLE: 1,
  READONLY_SIGNER: 2,
  WRITABLE_SIGNER: 3,
});
export const SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT = -1;
export const SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT =
  -2;
export const BASE_ACCOUNT_SIZE = 0;

// --- Throws if actually invoked: real Solana transaction/codec operations ---
export function address(): never {
  return unavailable('address');
}
export function createSolanaRpc(): never {
  return unavailable('createSolanaRpc');
}
export function createSolanaRpcSubscriptions(): never {
  return unavailable('createSolanaRpcSubscriptions');
}
export function addDecoderSizePrefix(): never {
  return unavailable('addDecoderSizePrefix');
}
export function addEncoderSizePrefix(): never {
  return unavailable('addEncoderSizePrefix');
}
export function appendTransactionMessageInstruction(): never {
  return unavailable('appendTransactionMessageInstruction');
}
export function appendTransactionMessageInstructions(): never {
  return unavailable('appendTransactionMessageInstructions');
}
export function assertAccountExists(): never {
  return unavailable('assertAccountExists');
}
export function assertAccountsExist(): never {
  return unavailable('assertAccountsExist');
}
export function combineCodec(): never {
  return unavailable('combineCodec');
}
export function compileTransaction(): never {
  return unavailable('compileTransaction');
}
export function containsBytes(): never {
  return unavailable('containsBytes');
}
export function createKeyPairSignerFromBytes(): never {
  return unavailable('createKeyPairSignerFromBytes');
}
export function createKeyPairSignerFromPrivateKeyBytes(): never {
  return unavailable('createKeyPairSignerFromPrivateKeyBytes');
}
export function createTransactionMessage(): never {
  return unavailable('createTransactionMessage');
}
export function decodeAccount(): never {
  return unavailable('decodeAccount');
}
export function decompileTransactionMessage(): never {
  return unavailable('decompileTransactionMessage');
}
export function fetchAddressesForLookupTables(): never {
  return unavailable('fetchAddressesForLookupTables');
}
export function fetchEncodedAccount(): never {
  return unavailable('fetchEncodedAccount');
}
export function fetchEncodedAccounts(): never {
  return unavailable('fetchEncodedAccounts');
}
export function fixDecoderSize(): never {
  return unavailable('fixDecoderSize');
}
export function fixEncoderSize(): never {
  return unavailable('fixEncoderSize');
}
export function getAddressDecoder(): never {
  return unavailable('getAddressDecoder');
}
export function getAddressEncoder(): never {
  return unavailable('getAddressEncoder');
}
export function getArrayDecoder(): never {
  return unavailable('getArrayDecoder');
}
export function getArrayEncoder(): never {
  return unavailable('getArrayEncoder');
}
export function getBase58Decoder(): never {
  return unavailable('getBase58Decoder');
}
export function getBase58Encoder(): never {
  return unavailable('getBase58Encoder');
}
export function getBase64Decoder(): never {
  return unavailable('getBase64Decoder');
}
export function getBase64EncodedWireTransaction(): never {
  return unavailable('getBase64EncodedWireTransaction');
}
export function getBase64Encoder(): never {
  return unavailable('getBase64Encoder');
}
export function getBooleanDecoder(): never {
  return unavailable('getBooleanDecoder');
}
export function getBooleanEncoder(): never {
  return unavailable('getBooleanEncoder');
}
export function getBytesDecoder(): never {
  return unavailable('getBytesDecoder');
}
export function getBytesEncoder(): never {
  return unavailable('getBytesEncoder');
}
export function getCompiledTransactionMessageDecoder(): never {
  return unavailable('getCompiledTransactionMessageDecoder');
}
export function getConstantDecoder(): never {
  return unavailable('getConstantDecoder');
}
export function getConstantEncoder(): never {
  return unavailable('getConstantEncoder');
}
export function getDiscriminatedUnionDecoder(): never {
  return unavailable('getDiscriminatedUnionDecoder');
}
export function getDiscriminatedUnionEncoder(): never {
  return unavailable('getDiscriminatedUnionEncoder');
}
export function getEnumDecoder(): never {
  return unavailable('getEnumDecoder');
}
export function getEnumEncoder(): never {
  return unavailable('getEnumEncoder');
}
export function getF64Decoder(): never {
  return unavailable('getF64Decoder');
}
export function getF64Encoder(): never {
  return unavailable('getF64Encoder');
}
export function getHiddenPrefixDecoder(): never {
  return unavailable('getHiddenPrefixDecoder');
}
export function getHiddenPrefixEncoder(): never {
  return unavailable('getHiddenPrefixEncoder');
}
export function getI16Decoder(): never {
  return unavailable('getI16Decoder');
}
export function getI16Encoder(): never {
  return unavailable('getI16Encoder');
}
export function getI64Decoder(): never {
  return unavailable('getI64Decoder');
}
export function getI64Encoder(): never {
  return unavailable('getI64Encoder');
}
export function getI8Decoder(): never {
  return unavailable('getI8Decoder');
}
export function getI8Encoder(): never {
  return unavailable('getI8Encoder');
}
export function getMapDecoder(): never {
  return unavailable('getMapDecoder');
}
export function getMapEncoder(): never {
  return unavailable('getMapEncoder');
}
export function getOptionDecoder(): never {
  return unavailable('getOptionDecoder');
}
export function getOptionEncoder(): never {
  return unavailable('getOptionEncoder');
}
export function getProgramDerivedAddress(): never {
  return unavailable('getProgramDerivedAddress');
}
export function getStructDecoder(): never {
  return unavailable('getStructDecoder');
}
export function getStructEncoder(): never {
  return unavailable('getStructEncoder');
}
export function getTransactionDecoder(): never {
  return unavailable('getTransactionDecoder');
}
export function getTransactionEncoder(): never {
  return unavailable('getTransactionEncoder');
}
export function getTupleDecoder(): never {
  return unavailable('getTupleDecoder');
}
export function getTupleEncoder(): never {
  return unavailable('getTupleEncoder');
}
export function getU16Decoder(): never {
  return unavailable('getU16Decoder');
}
export function getU16Encoder(): never {
  return unavailable('getU16Encoder');
}
export function getU32Decoder(): never {
  return unavailable('getU32Decoder');
}
export function getU32Encoder(): never {
  return unavailable('getU32Encoder');
}
export function getU64Decoder(): never {
  return unavailable('getU64Decoder');
}
export function getU64Encoder(): never {
  return unavailable('getU64Encoder');
}
export function getU8Decoder(): never {
  return unavailable('getU8Decoder');
}
export function getU8Encoder(): never {
  return unavailable('getU8Encoder');
}
export function getUnitDecoder(): never {
  return unavailable('getUnitDecoder');
}
export function getUnitEncoder(): never {
  return unavailable('getUnitEncoder');
}
export function getUtf8Decoder(): never {
  return unavailable('getUtf8Decoder');
}
export function getUtf8Encoder(): never {
  return unavailable('getUtf8Encoder');
}
export function padLeftEncoder(): never {
  return unavailable('padLeftEncoder');
}
export function partiallySignTransactionMessageWithSigners(): never {
  return unavailable('partiallySignTransactionMessageWithSigners');
}
export function pipe(): never {
  return unavailable('pipe');
}
export function prependTransactionMessageInstruction(): never {
  return unavailable('prependTransactionMessageInstruction');
}
export function sequentialInstructionPlan(): never {
  return unavailable('sequentialInstructionPlan');
}
export function setTransactionMessageFeePayer(): never {
  return unavailable('setTransactionMessageFeePayer');
}
export function setTransactionMessageFeePayerSigner(): never {
  return unavailable('setTransactionMessageFeePayerSigner');
}
export function setTransactionMessageLifetimeUsingBlockhash(): never {
  return unavailable('setTransactionMessageLifetimeUsingBlockhash');
}
export function transformEncoder(): never {
  return unavailable('transformEncoder');
}
export function unwrapOption(): never {
  return unavailable('unwrapOption');
}
export function upgradeRoleToSigner(): never {
  return unavailable('upgradeRoleToSigner');
}
export function wrapNullable(): never {
  return unavailable('wrapNullable');
}

// --- Also aliased in place of '@solana-program/system' (see next.config.ts) ---
export function getTransferSolInstruction(): never {
  return unavailable('getTransferSolInstruction');
}

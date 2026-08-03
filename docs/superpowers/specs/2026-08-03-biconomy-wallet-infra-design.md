# Biconomy wallet-infra swap: remove Openfort, wire Biconomy smart accounts

Date: 2026-08-03
Status: Approved, ready for implementation plan

## Context

Auth already migrated from Openfort to Privy (email/Google login + embedded
EOA wallet) in an earlier, undocumented pass — that part works and is
untouched by this spec. What's left over:

- **Openfort**: almost entirely dead code/naming (DB column, variable/function
  names, comments, copy) except `src/components/header.tsx`, which still
  renders a live `<OpenfortButton>` from `@openfort/react`. Since
  `src/lib/openfort-config.tsx` (stale filename) now wraps the app in
  `PrivyProvider`, not an Openfort provider, that button has no provider
  context to work against.
- **Particle**: no code references anywhere in `src/`. Only leftover GitHub
  Actions secrets exist (`PARTICLE_*`, `DEV_PARTICLE_*`), already handled
  outside this spec — nothing to remove in-repo.
- **Biconomy**: not wired at all. `@biconomy/abstractjs` is a dependency but
  pinned via `file:../abstractjs/biconomy-abstractjs-1.2.5.tgz` — a path to a
  folder outside this repo that will not exist in CI/Docker. Worse, the
  currently-installed copy in `node_modules` is a broken stub (only
  `LICENSE`/`README.md`/`package.json`, ~4.8KB — no `dist/`), vs. the real
  npm-published `1.2.5` package (~4.7MB unpacked). Nothing importable from it
  today.

Per `features_description.md` Phase 1: "Biconomy as wallet infrastructure,
Viem as execution layer." Privy stays as the auth/EOA-signer layer; Biconomy
wraps that EOA into a smart account (ERC-4337 Nexus account via ABI-level
`toMultichainNexusAccount`).

## Decisions (from brainstorming)

1. **Auth/wallet split**: Privy = auth + EOA signer (unchanged). Biconomy =
   smart-account layer on top. Biconomy does not touch authentication.
2. **Scope for this pass**: create the smart account and display its address.
   No transaction sending, no gas sponsorship/paymaster wiring — that's a
   later phase once a feature (swap/deposit) actually needs to send a userOp.
3. **Header wallet UI**: remove `<OpenfortButton>` outright. `AvatarMenu`
   already shows address/copy/connection-status — it's the wallet UI, no
   replacement widget needed.
4. **Address surfaced to users**: the Biconomy smart-account address only.
   The Privy EOA becomes an internal signing key, never shown in normal UI.
5. **DB rename**: do the real Prisma migration now — `openfortUserId`/
   `openfort_user_id` → `privyUserId`/`privy_user_id`. Also rename the
   in-code aliases (`linkExistingUserToOpenfort`, `openfortSession`, etc.)
   that store/reference Privy data under an Openfort-flavored name.
6. **Persistence**: none for this pass. Nexus accounts are counterfactual —
   deterministically derivable (CREATE2) from signer + chain config — so the
   address is recomputed client-side each session. The existing (currently
   unused) `Wallet` Prisma model is left alone; wiring the address into it is
   a follow-up once a backend feature needs to query it server-side.
7. **Chain scope**: single chain, matching the existing Privy chain selection
   (`baseSepolia` in dev / `base` in prod via `NEXT_PUBLIC_ENVIRONMENT`) — no
   multichain account, no scope creep beyond what auth already does.

## Architecture

```
Login (Privy) → embedded EOA wallet available
             → derive Nexus smart account client-side
               (toMultichainNexusAccount, single chain, no network call)
             → address cached in AuthSessionProvider state
             → consumed by AvatarMenu + account page WalletAddressRow
```

Smart-account derivation failure is a *recoverable* error (same bucket as
existing network-ish failures in `classifyError`) — it must not block login,
since app-session auth already succeeded via Privy independently of the
wallet layer. On failure, UI falls back to "Not connected" the same way it
does today when no embedded wallet exists yet.

## Files touched

**Remove (dead Openfort code/deps)**
- `src/components/header.tsx` — drop `<OpenfortButton>` + `@openfort/react` import
- `package.json` — remove `@openfort/openfort-js`, `@openfort/openfort-node`,
  `@openfort/react`, `@openfort/shield-js`; change `@biconomy/abstractjs` from
  the local tarball path to `^1.2.5` (public npm)
- Copy fixes: `account-page.tsx` ("Openfort wallet" → generic wording),
  `layout.tsx` CSP comment, `error-reporting.ts` area union, `lockout.ts` log
  string

**Rename (Prisma migration)**
- `prisma/schema.prisma`: `openfortUserId`/`openfort_user_id` →
  `privyUserId`/`privy_user_id`
- New file under `prisma/migrations/`
- `src/server/repositories/users.ts`, `src/server/services/account.ts`,
  `src/server/services/auth.ts` (rename vars/functions accordingly)
- `src/lib/backend-auth-client.ts` comment cleanup

**New (Biconomy wiring)**
- `src/lib/biconomy-smart-account.ts` — builds the Nexus account from a Privy
  embedded wallet, returns/caches the derived address
- `src/components/header/avatar-menu.tsx` — swap EOA address for
  smart-account address
- `src/components/account/account-page.tsx` — same swap in
  `WalletAddressRow`
- Rename `src/lib/openfort-config.tsx` → an accurately-named file (e.g.
  `app-providers.tsx`); update its one import site in `src/app/layout.tsx`

## Known open risk

The vendored `@biconomy/abstractjs` stub means the exact shape
`toMultichainNexusAccount`'s `signer` parameter expects (a viem `LocalAccount`
vs. a `WalletClient`/JSON-RPC account) hasn't been confirmed against a Privy
embedded wallet, which only exposes an EIP-1193 provider (no raw private
key). This gets resolved once the real `1.2.5` package is installed and its
types are inspected — implementation may need a small adapter
(`createWalletClient({ transport: custom(provider) })`) between Privy's
provider and whatever `toMultichainNexusAccount` accepts. If the SDK turns
out to require something Privy's embedded wallet cannot provide, that's
reported back before proceeding further, not silently worked around.

## Verification plan (account creation must be proven, not just compiled)

1. **Live run**: dev server, log in with a real Privy account (new user +
   existing user paths), confirm a smart-account address renders in
   `AvatarMenu` and the account page — not a "Not connected" fallback.
2. **Determinism check**: reload / log out and back in with the same
   account; the derived address must be byte-identical every time. This is
   the core correctness property of a counterfactual account.
3. **Distinctness check**: confirm the smart-account address differs from the
   underlying Privy EOA address (temporary debug log during dev testing) —
   proves it's wrapping the EOA, not echoing it back.
4. **Failure-path check**: simulate no embedded wallet yet; confirm the
   recoverable-error path engages cleanly instead of crashing the whole auth
   flow.
5. **Cross-check against Biconomy tooling**: if the real SDK/dashboard
   exposes an independent way to verify a Nexus account address for a given
   owner + config, use it once against a real derived address to catch a
   wrong factory/implementation version producing *an* address that isn't
   the one Biconomy's infra actually recognizes.
6. `npm install` succeeds without the sibling-folder tarball dependency;
   `npm run build` passes.

## Explicitly out of scope

Gas sponsorship/paymaster policy, sending any transaction via Biconomy MEE,
multichain accounts, persisting the address to the `Wallet` table, GitHub
Actions `PARTICLE_*` secret cleanup (no code depends on it).

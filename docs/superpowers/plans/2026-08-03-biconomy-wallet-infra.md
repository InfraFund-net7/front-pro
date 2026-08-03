# Biconomy Wallet-Infra Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead/leftover Openfort code and wire a real Biconomy Nexus smart account on top of the existing Privy embedded wallet, with the smart-account address proven to render correctly end-to-end.

**Architecture:** Privy stays as auth + EOA signer (unchanged). A new client-only module (`src/lib/biconomy-smart-account.ts`) derives a Biconomy Nexus smart account from that EOA via `toNexusAccount({ signer: <Privy EIP-1193 provider>, chainConfiguration })`. The address is counterfactual (CREATE2-deterministic) — no network call, no backend persistence in this pass. A thin hook (`src/lib/use-smart-account-address.ts`) exposes it to `AvatarMenu` and the account page, replacing the raw Privy EOA address they show today.

**Tech Stack:** Next.js 15 App Router, `@privy-io/react-auth` (auth + EOA), `@biconomy/abstractjs@1.2.5` (Nexus smart account, confirmed via real npm package — not the previously-vendored broken stub), viem (`http`, `base`, `baseSepolia`), Prisma (Postgres).

## Global Constraints

- No test runner is configured in this repo (CI is lint/build only — confirmed in CLAUDE.md and `package.json` scripts). "Test" steps in this plan mean: `npx tsc --noEmit` / `npm run format:lint` for static checks, and manual dev-server verification for runtime behavior. Do not introduce a test framework as part of this work — out of scope.
- Follow existing patterns: hooks/utilities live flat in `src/lib/` (see `src/lib/use-copy-to-clipboard.ts`), not in a `src/hooks/` directory.
- Every task that touches `git commit`: commit only the files that task lists. Never `git add -A`.
- The pre-commit hook runs `npm run format` (lint + prettier check + cspell + knip). If a task's own new/edited files fail prettier, fix formatting on those files only — never run `fix:prettier` repo-wide, since that would reformat unrelated in-progress files outside this plan's scope.
- Single chain only: `baseSepolia` in dev, `base` in prod (`NEXT_PUBLIC_ENVIRONMENT === 'production'`) — this already matches `src/lib/openfort-config.tsx`'s existing `defaultChain` logic. No multichain account, no paymaster/gas sponsorship, no transaction sending — those are explicitly out of scope per the approved spec (`docs/superpowers/specs/2026-08-03-biconomy-wallet-infra-design.md`).

---

### Task 1: Remove the dead OpenfortButton from the header

This runs before the dependency cleanup (Task 2) on purpose: `@openfort/react`
must lose its only call site *before* it's removed from `package.json` —
otherwise the codebase has a dangling import to an uninstalled package in
between the two tasks.

**Files:**
- Modify: `src/components/header.tsx:4,98`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — `AvatarMenu` (already rendered next to where the button was) remains the only wallet UI in the header.

- [ ] **Step 1: Remove the import**

In `src/components/header.tsx`, delete line 4:

```tsx
import { OpenfortButton } from '@openfort/react';
```

- [ ] **Step 2: Remove the button usage**

Delete this line (currently line 98, inside the `actions` JSX, right before `<AvatarMenu />`):

```tsx
            <OpenfortButton label="Wallet" showAvatar />
```

- [ ] **Step 3: Verify the file still type-checks**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "header.tsx" || echo "no errors in header.tsx"`
Expected: `no errors in header.tsx`

- [ ] **Step 4: Manual check**

Start the dev server (`npm run dev`), log in, and confirm the header renders with only the bell/headset icons and the avatar menu — no missing-provider crash, no empty gap where the button was.

- [ ] **Step 5: Commit**

```bash
git add src/components/header.tsx
git commit -m "fix(header): remove dead OpenfortButton (no Openfort provider exists anymore)"
```

---

### Task 2: Fix the Biconomy dependency and remove Openfort packages

**Files:**
- Modify: `package.json:38-42,66`
- Modify: `knip.json`

**Interfaces:**
- Produces: a working `@biconomy/abstractjs` install (real npm package, not the broken local-tarball stub) that later tasks import from.

**Context:** `knip.json`'s `ignoreDependencies` list currently contains temporary entries — `@biconomy/abstractjs`, `@openfort/openfort-js`, `@openfort/openfort-node`, `@openfort/react`, `@openfort/shield-js`, `@privy-io/node`, `wagmi` — added while unblocking pre-existing/in-flight state before and during this plan. This task removes the four that stop being real dependencies in this same task (`@openfort/openfort-js`, `@openfort/openfort-node`, `@openfort/react`, `@openfort/shield-js`), plus `wagmi` — Task 1 discovered `wagmi` has no direct import anywhere in `src/`; it was only ever needed as `@openfort/react`'s peer dependency (confirmed via `grep -rn "from 'wagmi'" src/` returning nothing), so it's orphaned the moment `@openfort/react` is gone. `@biconomy/abstractjs` stays ignored until Task 7 actually imports it. `@privy-io/node` is unrelated to this plan (a separate pre-existing unused dependency) and stays ignored — not this task's concern.

- [ ] **Step 1: Edit the dependency block**

In `package.json`, the current block (verified via `grep -n` before this plan was written):

```json
    "@biconomy/abstractjs": "file:../abstractjs/biconomy-abstractjs-1.2.5.tgz",
    "@openfort/openfort-js": "^1.3.3",
    "@openfort/openfort-node": "^0.10.3",
    "@openfort/react": "^1.0.15",
    "@openfort/shield-js": "^0.1.37",
```

Replace with:

```json
    "@biconomy/abstractjs": "^1.2.5",
```

(The four `@openfort/*` lines are deleted outright — nothing else in this part of the dependency list changes.)

Separately in the same file, `wagmi` is the last entry in `dependencies` (verified via `grep -n -B1 -A1 '"wagmi"' package.json` before this plan was written):

```json
    "viem": "^2.48.4",
    "wagmi": "^2.19.5"
  },
```

Replace with:

```json
    "viem": "^2.48.4"
  },
```

(Removes the trailing comma along with the `wagmi` line — `viem` becomes the last entry.)

- [ ] **Step 2: Reinstall and verify the real package is present**

Run: `npm install`

Then verify the stub is gone and the real package is installed:

Run: `test -d node_modules/@biconomy/abstractjs/dist && echo "REAL PACKAGE OK" || echo "STILL STUB"`
Expected: `REAL PACKAGE OK`

(Before this fix, `node_modules/@biconomy/abstractjs` had no `dist/` directory at all — only `LICENSE`/`README.md`/`package.json`, ~5KB total vs. the real package's ~4.7MB unpacked.)

- [ ] **Step 3: Confirm Openfort packages and wagmi are gone**

Run: `grep -c "@openfort" package.json`
Expected: `0`

Run: `grep -c '"wagmi"' package.json`
Expected: `0`

Run: `ls node_modules/@openfort 2>&1`
Expected: `No such file or directory` (npm install should have removed them; if the directory still exists from a stale install, it's harmless but confirm with the grep check above, which is what actually matters).

- [ ] **Step 4: Clean up the temporary knip ignores for the packages just removed**

By this point in the plan, `knip.json`'s `ignoreDependencies` array has this shape (`@openfort/react` and `wagmi` were added as temporary entries during Task 1's review/fix cycle — check the array's actual current contents with `cat knip.json` before editing, in case it differs slightly from below):

```json
  "ignoreDependencies": [
    "@openfort/react",
    "@openfort/shield-js",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "@biconomy/abstractjs",
    "@openfort/openfort-js",
    "@openfort/openfort-node",
    "@privy-io/node",
    "wagmi"
  ]
```

Change it to (removing the five entries for packages that no longer exist in `package.json`: `@openfort/react`, `@openfort/shield-js`, `@openfort/openfort-js`, `@openfort/openfort-node`, `wagmi`; keeping `@biconomy/abstractjs` ignored since it's still unused until Task 7, and `@privy-io/node` ignored since it's out of this plan's scope):

```json
  "ignoreDependencies": [
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "@biconomy/abstractjs",
    "@privy-io/node"
  ]
```

- [ ] **Step 5: Run the format check**

Run: `npm run format:knip`
Expected: no unused-dependency warnings.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json knip.json
git commit -m "fix(deps): switch @biconomy/abstractjs to published npm package, drop @openfort/* and orphaned wagmi peer dep"
```

---

### Task 3: Rename openfort-config.tsx and fix its stale comments

**Files:**
- Create: `src/lib/app-providers.tsx` (moved content)
- Delete: `src/lib/openfort-config.tsx`
- Modify: `src/app/layout.tsx:5,9-11`

**Interfaces:**
- Produces: `AppProviders` (unchanged export, unchanged behavior) and a newly-exported `defaultChain` constant that Task 7 imports.

- [ ] **Step 1: Move the file with git so history is preserved**

```bash
git mv src/lib/openfort-config.tsx src/lib/app-providers.tsx
```

- [ ] **Step 2: Export `defaultChain` for reuse**

In `src/lib/app-providers.tsx`, change:

```tsx
const defaultChain =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? base : baseSepolia;
```

to:

```tsx
export const defaultChain =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? base : baseSepolia;
```

(No other change to this file — the rest of `AppProviders` stays exactly as-is; it already wraps in `PrivyProvider`, not Openfort.)

- [ ] **Step 3: Update the import in layout.tsx**

In `src/app/layout.tsx`, change:

```tsx
import { AppProviders } from '@/lib/openfort-config';
```

to:

```tsx
import { AppProviders } from '@/lib/app-providers';
```

- [ ] **Step 4: Fix the stale CSP comment in layout.tsx**

Change (currently lines 8-11):

```tsx
export const metadata: Metadata = {
  // Openfort's embedded wallet iframe (https://embed.openfort.io/iframe/{pk})
  // 403s when the request has no Referer it can match against the project's
  // allowed origins. See docs-dev/tasks/task-101-fix-openfort-registration.md.
  referrer: 'origin',
};
```

to:

```tsx
export const metadata: Metadata = {
  referrer: 'origin',
};
```

(The referrer setting itself was a workaround for Openfort's iframe registration, which no longer exists — Privy's embedded wallet doesn't have this constraint. Dropping the stale comment rather than leaving a reference to a removed system. If `referrer: 'origin'` turns out to matter for something else, that would show up as a real regression during manual testing in Task 11, not silently — leave the setting itself in place, only remove the now-inaccurate comment.)

- [ ] **Step 5: Verify no remaining references to the old path**

Run: `grep -rn "openfort-config" src/ 2>/dev/null`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/app-providers.tsx src/lib/openfort-config.tsx src/app/layout.tsx
git commit -m "refactor: rename openfort-config.tsx to app-providers.tsx, drop stale Openfort comments"
```

---

### Task 4: Clean up remaining Openfort naming/copy (no behavior change)

**Files:**
- Modify: `src/components/account/account-page.tsx:192,225`
- Modify: `src/lib/error-reporting.ts:8`
- Modify: `src/server/auth/lockout.ts:32`
- Modify: `src/lib/backend-auth-client.ts:191`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — pure copy/naming cleanup, no signature changes.

- [ ] **Step 1: Fix user-facing copy in account-page.tsx**

Change:

```tsx
        <p className="text-sm text-[#8087A3] mb-6">
          Permanently deletes your account, your embedded wallet, and all
          associated data from InfraFund and Openfort. This action cannot be
          undone.
        </p>
```

to:

```tsx
        <p className="text-sm text-[#8087A3] mb-6">
          Permanently deletes your account, your embedded wallet, and all
          associated data from InfraFund. This action cannot be undone.
        </p>
```

And change:

```tsx
            <span className="text-sm text-[#C7CAD5]">
              My embedded Openfort wallet will be{' '}
              <span className="text-red-400 font-medium">
                permanently deleted
              </span>
            </span>
```

to:

```tsx
            <span className="text-sm text-[#C7CAD5]">
              My embedded wallet will be{' '}
              <span className="text-red-400 font-medium">
                permanently deleted
              </span>
            </span>
```

- [ ] **Step 2: Fix the error-reporting area union**

In `src/lib/error-reporting.ts`, change:

```ts
  area: 'auth' | 'wallet' | 'openfort' | 'telemetry' | 'unknown';
```

to:

```ts
  area: 'auth' | 'wallet' | 'telemetry' | 'unknown';
```

Then confirm nothing else in the codebase passes `area: 'openfort'` (which would now fail to type-check — that's the point):

Run: `grep -rn "area: 'openfort'" src/ 2>/dev/null`
Expected: no output. If there is output, change that call site's `area` to `'wallet'` (the closest accurate category) as part of this step.

- [ ] **Step 3: Fix the lockout log message**

In `src/server/auth/lockout.ts`, change:

```ts
      'Openfort exchange attempt blocked by account lockout'
```

to:

```ts
      'Privy exchange attempt blocked by account lockout'
```

- [ ] **Step 4: Fix the backend-auth-client.ts comment**

In `src/lib/backend-auth-client.ts`, change:

```ts
  privy_user_id: string; // was openfort_user_id — DB column rename deferred to future migration
```

to:

```ts
  privy_user_id: string;
```

(Task 5 performs that migration in this same session, so "deferred to future migration" becomes inaccurate.)

- [ ] **Step 5: Verify build still passes**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors compared to before this task (pre-existing warnings noted in the repo, e.g. unused vars in `main-layout.tsx`/`account.ts`, are not introduced by this task and are out of scope to fix here).

- [ ] **Step 6: Commit**

```bash
git add src/components/account/account-page.tsx src/lib/error-reporting.ts src/server/auth/lockout.ts src/lib/backend-auth-client.ts
git commit -m "chore: remove remaining Openfort naming/copy leftovers from the Privy migration"
```

---

### Task 5: Prisma migration — rename openfortUserId to privyUserId

**Files:**
- Modify: `prisma/schema.prisma:112`
- Create: `prisma/migrations/20260803120000_rename_openfort_user_id_to_privy_user_id/migration.sql`

**Interfaces:**
- Produces: `User.privyUserId` (mapped to DB column `privy_user_id`) — Task 6 updates every call site that currently reads `user.openfortUserId`.

- [ ] **Step 1: Rename the field in schema.prisma**

In `prisma/schema.prisma`, change:

```prisma
  openfortUserId          String            @unique @map("openfort_user_id") @db.VarChar(255)
```

to:

```prisma
  privyUserId             String            @unique @map("privy_user_id") @db.VarChar(255)
```

- [ ] **Step 2: Write the migration SQL**

The existing column and its unique index (from `prisma/migrations/20260513143000_init/migration.sql`) are named `"openfort_user_id"` and `"users_openfort_user_id_key"`. Create
`prisma/migrations/20260803120000_rename_openfort_user_id_to_privy_user_id/migration.sql`:

```sql
-- Rename openfort_user_id to privy_user_id: this column has stored Privy
-- user IDs since the Openfort-to-Privy auth migration; only the name was
-- never updated.
ALTER TABLE "users" RENAME COLUMN "openfort_user_id" TO "privy_user_id";
ALTER INDEX "users_openfort_user_id_key" RENAME TO "users_privy_user_id_key";
```

- [ ] **Step 3: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: completes without error, and the generated client's `User` type now has `privyUserId` instead of `openfortUserId` — verify with:

Run: `grep -rn "privyUserId" node_modules/.prisma/client/*.d.ts 2>/dev/null | head -3`
Expected: at least one match.

- [ ] **Step 4: If a local dev database is available, apply and verify the migration for real**

This step requires Docker (`deployment/docker-compose.local.yml`). If Docker isn't available in your environment, skip this step — Step 3 already proves the schema/migration pair is internally consistent, and the migration will apply for real the next time `db:neon:migrate` (or equivalent deploy step) runs against an environment with actual DB access.

```bash
npm run db:local:setup
npx prisma migrate deploy
```

Expected: `1 migration found... Applying migration ...rename_openfort_user_id_to_privy_user_id... The following migration(s) have been applied: ...` with no errors.

Then verify the column was actually renamed:

```bash
docker exec infrafund-front-pro-postgres psql -U postgres -d infra_dev -c "\d users" | grep -i "privy_user_id\|openfort_user_id"
```

Expected: `privy_user_id` present, `openfort_user_id` absent.

- [ ] **Step 5: Run the repo's own migration-sync check**

Run: `MIGRATION_CHECK_BASE=develop node scripts/check-prisma-migration-sync.mjs`
Expected: `Prisma schema and migration files are in sync relative to develop.` (This is the same check CI runs — confirms the migration file is committed alongside the schema change, not just the schema change alone.)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260803120000_rename_openfort_user_id_to_privy_user_id/
git commit -m "feat(db): rename openfort_user_id column to privy_user_id"
```

---

### Task 6: Update server code for the renamed Prisma field

**Files:**
- Modify: `src/server/repositories/users.ts:8,30-51,59,109`
- Modify: `src/server/services/account.ts:46,65`
- Modify: `src/server/services/auth.ts:132,164`

**Interfaces:**
- Consumes: `User.privyUserId` from Task 5's Prisma schema.
- Produces: `linkExistingUserToPrivy` (renamed from `linkExistingUserToOpenfort`) — no other exported names change.

- [ ] **Step 1: Update repositories/users.ts**

Change the interface comment (line 8):

```ts
export interface CreateUserRecord {
  // Stored in the openfort_user_id column (DB rename deferred to a future migration)
  privyUserId: string;
```

to:

```ts
export interface CreateUserRecord {
  privyUserId: string;
```

Change `findUserByPrivyId` (was using `openfortUserId` as the where-clause key):

```ts
export function findUserByPrivyId(privyUserId: string) {
  return getDb().user.findFirst({
    where: {
      openfortUserId: privyUserId,
      deletedAt: null,
    },
  });
}
```

to:

```ts
export function findUserByPrivyId(privyUserId: string) {
  return getDb().user.findFirst({
    where: {
      privyUserId,
      deletedAt: null,
    },
  });
}
```

Change `attachPrivyUserId`:

```ts
export function attachPrivyUserId(userId: string, privyUserId: string) {
  return getDb().user.update({
    where: { id: userId },
    data: { openfortUserId: privyUserId },
  });
}
```

to:

```ts
export function attachPrivyUserId(userId: string, privyUserId: string) {
  return getDb().user.update({
    where: { id: userId },
    data: { privyUserId },
  });
}
```

Change `createUser`'s transaction body:

```ts
    const user = await tx.user.create({
      data: {
        openfortUserId: record.privyUserId,
        email: record.email,
```

to:

```ts
    const user = await tx.user.create({
      data: {
        privyUserId: record.privyUserId,
        email: record.email,
```

Change `softDeleteUserAccount`'s update call:

```ts
      data: {
        email: null,
        phoneNumber: null,
        openfortUserId: `deleted:${userId}`, // column rename deferred to future migration
        dataDeletionRequestedAt: user.dataDeletionRequestedAt ?? now,
```

to:

```ts
      data: {
        email: null,
        phoneNumber: null,
        privyUserId: `deleted:${userId}`,
        dataDeletionRequestedAt: user.dataDeletionRequestedAt ?? now,
```

- [ ] **Step 2: Update services/account.ts**

Change both occurrences (in `getCurrentUser` and `getAccountStatus`) of:

```ts
    privy_user_id: user.openfortUserId, // DB column rename deferred to future migration
```

to:

```ts
    privy_user_id: user.privyUserId,
```

- [ ] **Step 3: Update services/auth.ts**

Rename the function and its call site. Change:

```ts
async function linkExistingUserToOpenfort(
  userId: string,
  session: VerifiedPrivySession
) {
```

to:

```ts
async function linkExistingUserToPrivy(
  userId: string,
  session: VerifiedPrivySession
) {
```

And change its only call site:

```ts
  return linkExistingUserToOpenfort(emailMatchedUser.id, session);
```

to:

```ts
  return linkExistingUserToPrivy(emailMatchedUser.id, session);
```

Also rename the locally-confusing variable in `exchangePrivySession` (it holds a verified Privy session, not an "Openfort" one):

```ts
export async function exchangePrivySession(input: PrivyExchangeInput) {
  const openfortSession = await verifyPrivyAccessToken(input.accessToken);
  const { user, created } = await findOrCreateUser(input, openfortSession);
```

to:

```ts
export async function exchangePrivySession(input: PrivyExchangeInput) {
  const privySession = await verifyPrivyAccessToken(input.accessToken);
  const { user, created } = await findOrCreateUser(input, privySession);
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `openfortUserId` (that field no longer exists on the Prisma `User` type after Task 5, so any missed call site fails loudly here rather than at runtime).

- [ ] **Step 5: Commit**

```bash
git add src/server/repositories/users.ts src/server/services/account.ts src/server/services/auth.ts
git commit -m "refactor: update server code for the privyUserId column rename"
```

---

### Task 7: Create the Biconomy smart-account derivation module

**Files:**
- Create: `src/lib/biconomy-smart-account.ts`
- Modify: `knip.json`

**Interfaces:**
- Consumes: `defaultChain` from `@/lib/app-providers` (Task 3); a Privy `ConnectedWallet` (from `@privy-io/react-auth`, already a dependency).
- Produces: `getSmartAccountAddress(wallet: ConnectedWallet): Promise<Address>` and `smartAccountChain` (re-exported chain constant) — Task 8's hook imports both.

**Context:** `knip.json`'s `ignoreDependencies` list has had a temporary `@biconomy/abstractjs` entry since Task 2 (added because the package existed but had no real usage yet). This task is what finally uses it — remove that entry as part of this task, since leaving it would mask a real future regression if the import were ever accidentally deleted.

- [ ] **Step 1: Write the module**

```ts
import 'client-only';

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
```

(`import 'client-only'` matches this repo's convention of marking browser-only modules — mirrors `import 'server-only'` used throughout `src/server/`. If `client-only` isn't already a dependency, check with `grep -n '"client-only"' package.json`; if absent, drop that import line rather than adding a new dependency for this — it's a defensive marker, not a functional requirement.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "biconomy-smart-account" || echo "no errors"`
Expected: `no errors`

If TypeScript complains that the Privy `EIP1193Provider` doesn't structurally satisfy Biconomy's expected signer type, cast defensively at the call site: `signer: provider as unknown as Parameters<typeof toNexusAccount>[0]['signer']`. Only add this cast if the type-check step actually reports the mismatch — don't add it preemptively.

- [ ] **Step 3: Remove the now-obsolete knip ignore entry**

In `knip.json`, change:

```json
  "ignoreDependencies": [
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "@biconomy/abstractjs",
    "@privy-io/node"
  ]
```

to:

```json
  "ignoreDependencies": [
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "@privy-io/node"
  ]
```

Run: `npm run format:knip`
Expected: no unused-dependency warning for `@biconomy/abstractjs` (it's now actually imported by this file).

- [ ] **Step 4: Commit**

```bash
git add src/lib/biconomy-smart-account.ts knip.json
git commit -m "feat(wallet): derive Biconomy Nexus smart-account address from Privy EOA"
```

---

### Task 8: Create the `useSmartAccountAddress` hook

**Files:**
- Create: `src/lib/use-smart-account-address.ts`

**Interfaces:**
- Consumes: `getSmartAccountAddress`, `smartAccountChain` from `@/lib/biconomy-smart-account` (Task 7); `useWallets` from `@privy-io/react-auth`.
- Produces: `useSmartAccountAddress(): { address: Address | null; chainId: number; status: 'idle' | 'loading' | 'ready' | 'error' }` — Tasks 9 and 10 consume this.

- [ ] **Step 1: Write the hook**

```ts
'use client';

import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import type { Address } from 'viem';
import {
  getSmartAccountAddress,
  smartAccountChain,
} from '@/lib/biconomy-smart-account';

type SmartAccountStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useSmartAccountAddress() {
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
  const [address, setAddress] = useState<Address | null>(null);
  const [status, setStatus] = useState<SmartAccountStatus>('idle');

  useEffect(() => {
    if (!embeddedWallet) {
      setAddress(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    getSmartAccountAddress(embeddedWallet)
      .then((derivedAddress) => {
        if (cancelled) return;
        setAddress(derivedAddress);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setAddress(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [embeddedWallet]);

  return { address, chainId: smartAccountChain.id, status };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "use-smart-account-address" || echo "no errors"`
Expected: `no errors`

- [ ] **Step 3: Commit**

```bash
git add src/lib/use-smart-account-address.ts
git commit -m "feat(wallet): add useSmartAccountAddress hook"
```

---

### Task 9: Wire the smart-account address into AvatarMenu

**Files:**
- Modify: `src/components/header/avatar-menu.tsx:1-21`

**Interfaces:**
- Consumes: `useSmartAccountAddress` from `@/lib/use-smart-account-address` (Task 8).

- [ ] **Step 1: Replace the EOA address with the smart-account address**

Change the imports (currently lines 1-8):

```tsx
'use client';

import { useWallets } from '@privy-io/react-auth';
import { Check, Copy, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { useCopyToClipboard } from '@/lib/use-copy-to-clipboard';
```

to:

```tsx
'use client';

import { Check, Copy, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { useCopyToClipboard } from '@/lib/use-copy-to-clipboard';
import { useSmartAccountAddress } from '@/lib/use-smart-account-address';
```

Change (currently lines 15-21):

```tsx
export function AvatarMenu() {
  const router = useRouter();
  const { backendUser, privyUser, logout } = useAuthSession();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
  const address = embeddedWallet?.address;
  const isWalletConnected = Boolean(address);
```

to:

```tsx
export function AvatarMenu() {
  const router = useRouter();
  const { backendUser, privyUser, logout } = useAuthSession();
  const { address: smartAccountAddress, status: smartAccountStatus } =
    useSmartAccountAddress();
  const address = smartAccountAddress ?? undefined;
  const isWalletConnected = smartAccountStatus === 'ready' && Boolean(address);
```

Everything below this (the `shortenAddress`, `handleCopy`, and JSX rendering `address`) already reads from the local `address`/`isWalletConnected` variables — no further changes needed in this file.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "avatar-menu" || echo "no errors"`
Expected: `no errors`

- [ ] **Step 3: Manual check**

`npm run dev`, log in, open the avatar menu, confirm the "Wallet" row shows an address and the green "connected" dot lights up once derivation completes (there will be a brief moment showing "Not connected" while `status === 'loading'` — that's expected, not a bug).

- [ ] **Step 4: Commit**

```bash
git add src/components/header/avatar-menu.tsx
git commit -m "feat(wallet): show Biconomy smart-account address in AvatarMenu"
```

---

### Task 10: Wire the smart-account address into the account page

**Files:**
- Modify: `src/components/account/account-page.tsx:1-91`

**Interfaces:**
- Consumes: `useSmartAccountAddress` from `@/lib/use-smart-account-address` (Task 8).

- [ ] **Step 1: Replace the EOA address with the smart-account address**

Change the imports (currently lines 1-10):

```tsx
'use client';

import { useWallets } from '@privy-io/react-auth';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { getAddressExplorerUrl, getChainName } from '@/lib/block-explorer';
import { useCopyToClipboard } from '@/lib/use-copy-to-clipboard';
import { Modal } from '@/components/ui/modal';
import { CustomButton } from '@/components/ui/custom-button';
```

to:

```tsx
'use client';

import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { getAddressExplorerUrl, getChainName } from '@/lib/block-explorer';
import { useCopyToClipboard } from '@/lib/use-copy-to-clipboard';
import { useSmartAccountAddress } from '@/lib/use-smart-account-address';
import { Modal } from '@/components/ui/modal';
import { CustomButton } from '@/components/ui/custom-button';
```

Change (currently lines 83-91):

```tsx
export default function AccountPage() {
  const { backendUser, privyUser, deleteAccount } = useAuthSession();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address;
  // Privy chainId is a string like "eip155:8453"; parse to number for display.
  const walletChainId = embeddedWallet?.chainId
    ? Number(embeddedWallet.chainId.split(':')[1] ?? embeddedWallet.chainId)
    : undefined;
```

to:

```tsx
export default function AccountPage() {
  const { backendUser, privyUser, deleteAccount } = useAuthSession();
  const { address: smartAccountAddress, chainId: walletChainId } =
    useSmartAccountAddress();
  const walletAddress = smartAccountAddress ?? undefined;
```

(The chain is now sourced from `smartAccountChain.id`, i.e. our own single-chain config, rather than parsed from Privy's reported `wallet.chainId` — the smart account always lives on the chain we configured it for, which is the correct source of truth here, not whatever chain the EOA happens to be connected to.)

Everything below this line (the `WalletAddressRow` render call at the bottom of the component, using `walletAddress`/`walletChainId`) is unchanged.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "account-page" || echo "no errors"`
Expected: `no errors`

- [ ] **Step 3: Manual check**

`npm run dev`, log in, navigate to `/account`, confirm the Wallet row shows the smart-account address, a working copy button, and (if the block explorer supports the configured chain) a working explorer link.

- [ ] **Step 4: Commit**

```bash
git add src/components/account/account-page.tsx
git commit -m "feat(wallet): show Biconomy smart-account address on the account page"
```

---

### Task 11: End-to-end verification of account creation

**Files:** none (verification only — no code changes).

**Interfaces:** none.

This task exists because "the code compiles" is not the same as "the smart account actually gets created correctly." Each step below directly answers a question the design's Known Risk / Verification Plan sections raised.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: succeeds with no new errors (pre-existing warnings noted in `main-layout.tsx`/`account.ts` are not this plan's concern).

- [ ] **Step 2: Live derivation — new user path**

`npm run dev`. Register a brand-new user through the full qualification-questionnaire flow. After `createWalletIfNeeded` completes, confirm the avatar menu and `/account` page both show a real, non-empty `0x...` address — not "Not connected".

- [ ] **Step 3: Live derivation — existing user path**

Log out, log back in with the same account. Confirm the address shown is identical to Step 2's. This is the core correctness property of a counterfactual smart account: same signer + same chain config must always yield the same address. If it differs, the signer or chain configuration passed to `toNexusAccount` is not stable across sessions — stop and investigate before proceeding, don't paper over it.

- [ ] **Step 4: Distinctness check**

While still logged in from Step 3, open the browser console and temporarily run:

```js
// paste in devtools console while on any authenticated page
window.__privy_wallets__ // (if not exposed, instead compare visually:)
```

Simpler and more reliable: temporarily add `console.log('EOA:', embeddedWallet?.address, 'Smart account:', address)` inside `AvatarMenu` (right after computing `address` in Task 9), reload, compare the two logged values in devtools, then remove the temporary log before committing anything further. Confirm the two addresses are different — this proves the Nexus account is actually wrapping the EOA rather than accidentally passing it straight through.

- [ ] **Step 5: Failure-path check**

Temporarily force `embeddedWallet` to `undefined` in `use-smart-account-address.ts` (e.g. `const embeddedWallet = undefined;` above the real lookup, commented out) and reload a logged-in session. Confirm: no crash, `status` stays `'idle'`, UI shows "Not connected" cleanly. Then revert the temporary change — do not commit it.

- [ ] **Step 6: Record the outcome**

If all of Steps 2-5 pass: the account-creation path is verified working end-to-end. If any step fails, stop and report exactly which step failed and what was observed (e.g. "address changed between sessions" or "TypeScript required a cast on the signer param") rather than proceeding to mark this plan complete — those are the two risks flagged in the design doc's Known Open Risk section, and either one failing means the assumption about Privy's `EIP1193Provider` being directly usable as Biconomy's `signer` needs revisiting.

No commit for this task — it's verification only. If Step 4 or 5's temporary debug code is accidentally left in a tracked file, `git status` and `git diff` before any other task's commit to confirm it isn't included.

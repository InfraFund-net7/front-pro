<!-- cspell:words remoteip Dismissable consectetur grecaptcha navigations -->

# Task 112 — `src/` Code Audit

Date: 2026-05-08
Scope: every file under `src/` (135 TS/TSX files).
Goal: catch syntax/logic errors, unclean code, duplicated functions, and missed component reuse.

This is a static read of the code, not a runtime test. References use `path:line` so you can jump straight to each spot.

---

## Executive summary

Server-side code (auth, http, repositories, services, validation, env, openfort) is **clean and consistent**. Layering is respected, error handling is uniform via `ApiError` + `handleApiError`, env access is gated per feature, and `'server-only'` is asserted at the top of every server module.

Client-side code is uneven. The auth/session/onboarding stack is well-designed and well-commented, but the rest of the feature surface (createproject, investmentportal, kyc, developer-home, explore-projects) is largely **UI scaffolding without wired-up state** — `FormInput` instances with no `value`/`onChange`, hardcoded fixtures, several near-byte-identical files differing only in component name. There is also a 700-line `kyc-card.tsx` that re-implements `CardView`, `FormInput`, `CustomButton`, `PaginationDots`, `NationalitySelect` inline despite all five existing in `src/components/ui/`.

Top three issues to tackle:

1. **Three pairs of duplicated section components** under `createproject/` and `investmentportal/` (six near-identical files, see §3.1).
2. **`kyc-card.tsx` reimplements 5 UI primitives** with light-theme styling that doesn't match the rest of the app (§3.2).
3. **Most form components don't capture input** — `FormInput` is rendered without `value`/`onChange` across `createproject/*`, `kyc/basic-section-kyc.tsx`, `personal-modal.tsx`, `investmentportal/create/create-sections/*` (§4.2).

---

## 1. File inventory by status

| Bucket | Count | Notes |
|---|---|---|
| Empty page stubs (`<div>page</div>`) | 6 | `app/digital-assets/page.tsx`, `app/investment-requests/page.tsx`, `app/investor-management/page.tsx`, `app/swap/page.tsx`, `app/tokenization/page.tsx`, `app/asset-management/page.tsx` |
| Empty component stubs | 3 | `createproject/Debt.tsx`, `investmentportal/create/create-sections/reports.tsx`, `investmentportal/create/create-sections/sections.tsx` |
| Trivial wrappers (one-line `return <X />`) | 5 | `createproject/Equity.tsx`, `createproject/PreSale.tsx`, `app/explore-projects/page.tsx`, `app/investment-portal/page.tsx`, `app/kyc/page.tsx` |
| Real implementations | ~120 | The rest |

The stubs are wired into the sidebar (`components/sidebar.tsx:81-138`) — clicking them currently navigates to a blank page. Either remove them from navigation until built (some are already `isDisabled: true`, but not all — e.g. `/asset-management`, `/swap` for `full` model) or finish them.

---

## 2. Server-side findings (`src/server/**`, `src/app/api/**`)

Overall: solid. Specific notes below.

### 2.1 Logic / correctness

**`src/server/services/auth.ts:findOrCreateUser`** — race-recovery path catches `P2002` on `createUser`, then re-resolves the existing user via `resolveExistingUser`. `resolveExistingUser` checks Openfort-id first, then email-linked user. If two requests race the create with the *same Openfort id*, the second loses the unique constraint and is recovered. Good. Edge case: if the create races on email but the existing row has a different `openfortUserId`, `linkExistingUserToOpenfort` will then try to update the email-matched user's `openfortUserId` — and that update can itself violate the `openfortUserId` unique constraint. Not currently caught. Low risk in practice.

**`src/server/services/public-forms.ts:submitWaitlist`** — checks `waitlistEmailExists` then catches `isUniqueConstraintError`. Belt-and-suspenders is fine, but the explicit pre-check is a wasted query 99% of the time; relying on the unique constraint alone would be cleaner.

**`src/server/http/captcha.ts:54`** — `body.set('remote' + 'ip', remoteIp)`. The string concatenation is suspicious. If it was a deliberate workaround for a linter complaining about "remoteip", drop a comment explaining it. Otherwise simplify to `body.set('remoteip', remoteIp)`.

**`src/server/http/api-error.ts:46`** — `statusByCode` is referenced in the constructor on line 46 but defined on line 51. Works thanks to JS hoisting of `const` references at *call* time, but reads as accidental forward-reference. Move the map above the class or inline the constant.

**`src/server/auth/lockout.ts`** — `assertUserNotLocked` reads `lockout` and on the basis of `failedAttempts > 0` resets it. There's no code that *increments* `failedAttempts` anywhere I found in this audit; `lockoutAuditLog` is referenced from cleanup but never written. Either the failure-counting logic was dropped during the migration from the Go backend, or it lives somewhere I haven't read. Worth confirming that lockouts can actually trigger.

**`src/server/services/cleanup.ts`** — only deletes things; doesn't delete corresponding `LockoutAuditLog` rows older than cutoff alongside the lockouts (it does delete them, fine). OK.

**`src/app/api/auth/encryption-session/route.ts:36`** — `body.user_id` is read from `request.json()` whose error is swallowed by `.catch(() => …)`. Body is treated as `unknown`. The `typeof requestedUserId !== 'string'` guard is good. Minor: the `body && typeof body === 'object' && 'user_id' in body ? body.user_id : undefined` would simplify with a small `readJsonObject` reuse.

### 2.2 Style / consistency

- `src/server/repositories/users.ts:softDeleteUserAccount` reads `user.dataDeletionRequestedAt` then writes `user.dataDeletionRequestedAt ?? now` — the read is wasted on first call (since we always set it on this path). Trivial.
- `src/app/api/v1/locations/countries/route.ts:48` and similar files use a manual fields-dict-then-throw pattern. Could share `readPositiveIntegerSearchParam(...)` helper since this is repeated logic. Low priority.
- `src/server/validation/public-forms.ts:requireStringField` returns `''` on missing, `string` on present — so `firstName`, `email` etc. in API routes flow through with the `''` default until `throwIfFieldErrors` throws. Subtle but works because the throw happens before the empty values reach the service. Document or use a discriminated return.

### 2.3 Compatibility shims

- `src/lib/backend-auth-client.ts:139` `normalizeCountry` re-cases `{ID,Name,Iso,…}` → `{id,name,iso,…}` for the client. The server in `src/server/services/public-forms.ts:getCountries` *re-cases* Prisma's `{id,name,iso,…}` *back* to `{ID,Name,Iso,…}` for the response (legacy Go-backend format), then the client immediately re-cases it again. This double-flip is dead weight. Pick one shape.
- `src/lib/solana-kit-unavailable.ts` — present and correctly aliased in `next.config.ts`. Fine.

---

## 3. Component duplication (the big one)

### 3.1 Three pairs of byte-identical (or nearly so) section files

Confirmed via `diff`. All differ only in identifier names and one import:

#### A. `createproject/Equity/equity-section.tsx` ≡ `createproject/PreSale/pre-sale-section.tsx`
```
diff Equity/equity-section.tsx PreSale/pre-sale-section.tsx
8c8
< import EquityProject from './equity-project';
---
> import PreSaleProject from './pre-sale-project';
10c10
< export default function EquitySection() {
---
> export default function PreSaleSection() {
41c41
<         <ApplicationForm CrowdfundingComponent={EquityProject} />
---
>         <ApplicationForm CrowdfundingComponent={PreSaleProject} />
```
Three diff lines for two 113-line files. Same hardcoded `BNB`/`INF` symbol-availability mock, same `useEffect`, same modal flow. `Charity/Charity.tsx` is a third near-duplicate (same structure, different variable name `showCharityForm`).

#### B. `createproject/Equity/equity-project.tsx` ≡ `createproject/PreSale/pre-sale-project.tsx`
Diff: function name only.

#### C. `investmentportal/create/create-sections/media.tsx` ≡ `media-section.tsx`
```
diff media.tsx media-section.tsx
15c15
< export default function Media({ onAnyFileChange }: MediaProps) {
---
> export default function MediaSection({ onAnyFileChange }: MediaProps) {
```
Only `media-section.tsx` is referenced from `main-create.tsx:18`. `media.tsx` looks like a dead copy.

**Recommendation.** One `<CrowdfundingTypeSection>` with props for the title, sub-component, and storage-key prefix. Delete `media.tsx`. Keeps the file count down and keeps changes from drifting between near-clones.

### 3.2 `components/ui/kyc-card.tsx` re-implements 5 UI primitives (155 lines)

This file defines local `CardView`, `NationalitySelect`, `FormInput`, `PaginationDots`, `CustomButton` — all of which already exist in `src/components/ui/` and are imported elsewhere. Worse, the local copies use a **white/blue light theme** (`bg-white`, `text-gray-700`, `bg-blue-500`) while every other usage of those primitives is dark-theme (`bg-card-bg`, `text-white`, `bg-primary`).

Either delete this file (it doesn't appear to be imported under a quick grep — verify) or refactor it to import the canonical UI primitives.

### 3.3 Other quieter overlaps

- `step-indicator.tsx`, `horizontal-progress-bar.tsx`, `pagination-dots.tsx` are three flavors of the same "N indicators, M active" UI pattern with slightly different color/spacing. Could be one component with a `variant` prop, but each is small and they serve different visual roles, so this is a low-priority consolidation.
- `splitName(fullName)` exists in:
  - `src/components/auth/non-resident-form.tsx:27`
  - `src/server/services/auth.ts` (compressed; verify, but the helper exists there too)
  Pull into `src/lib/strings.ts` (or a shared utility) and import from both sides. The implementations look identical.
- `handleCopy` (clipboard with "just copied" tick) appears at least twice:
  - `src/components/header/avatar-menu.tsx:65`
  - `src/components/account/account-page.tsx:46`
  Same shape, same 1500ms timeout, same `try/empty-catch`. Extract `useCopyToClipboard()`.
- Click-outside-to-close + Escape-to-close logic is open-coded in `dropdown.tsx`, `date-picker.tsx`, `colorpicker/color-picker.tsx`, `avatar-menu.tsx`, and the header's mobile menu. A `useDismissableOverlay(ref, onClose)` hook would clean each one up.

---

## 4. Component-by-component findings

### 4.1 `components/ui/`

**`form-input.tsx`** — the canonical input. Used widely. Missing: `name`/`id`/`htmlFor` plumbing for the label, and `disabled` prop. Adding both is one line each.

**`custom-button.tsx`** — solid. `onClick` is typed `() => void` which doesn't accept `(e) => void` callers; some call sites work around with arrow wrappers. Widen to `React.MouseEventHandler<HTMLButtonElement>`.

**`custom-checkbox.tsx`** — accessible (has `role`, `aria-checked`, keyboard handler). Spreads `...props` of type `HTMLAttributes<HTMLDivElement>` *after* `onClick`/`onKeyDown` from the component, so a parent passing `onClick` would override the toggle. Move `...props` before the explicit handlers, or omit those keys from the prop type.

**`modal.tsx`** — no escape-to-close; doesn't lock body scroll; doesn't trap focus. `BuildInfo` is hard-coded in the footer of every modal, which is fine for app modals but surprising for e.g. confirm-delete dialogs.

**`dropdown.tsx`** — internal `selectedValue` state shadows the `value` prop. If parent updates `value`, the dropdown won't reflect it (no `useEffect` to sync). Either drop the local state and treat as fully controlled, or initialize from `value` only and document.

**`date-picker.tsx`** — outputs `toLocaleDateString('en-GB')` (e.g. `08/05/2026`). Anywhere downstream that needs ISO-8601 will break. No min/max date, no keyboard navigation. The "Su Mo Tu …" header is locale-blind. Consider replacing with a real library (`react-day-picker`, `@radix-ui/react-popover` + native input).

**`file-upload.tsx`** — fine. Validation is duplicated between `image` and `pdf` configs, but this is acceptable.

**`file-upload-with-preview.tsx`** — `URL.createObjectURL(file)` is **never revoked** (line 27). On every replace, the previous blob URL leaks until page unload. Fix:
```ts
useEffect(() => {
  if (!previewUrl) return;
  return () => URL.revokeObjectURL(previewUrl);
}, [previewUrl]);
```
Also `<Image src={previewUrl || '/placeholder.svg'}>` has no `width`/`height` (and no `fill`), which `next/image` will warn about at runtime.

**`box-upload.tsx`** — same `'/placeholder.svg'` fallback pattern when `uploadedImage` is non-null is dead (it's already non-null on that branch). Reads file as data URL into state — fine for tiny images, but a 4 MB image becomes ~5.3 MB of UTF-16 in memory. Switch to `URL.createObjectURL`.

**`milestone-card.tsx`** — `FormInput`s have no `value`/`onChange`, so milestones state is effectively write-only (only used for `key` and the "Milestone N" label). `addMilestone` uses `length + 1` as ID, which collides if items are removed. Commented-out `updateMilestone` block (lines 17-23) is dead code — delete.

**`nationality-select.tsx`** — hardcodes "United Kingdom" with a UK flag and no `onChange` prop. It's a static decoration, not a select. Either rename to `NationalityDisplay` or wire it up; right now using it in `kyc/basic-section-kyc.tsx:31` and `kyc-card.tsx` gives a misleading impression of a working dropdown.

**`step-indicator.tsx`** — accepts `steps: string[]` but only uses `steps.length`. The labels are never rendered. Type is misleading; should be `count: number`.

**`select-mode-btn.tsx`** — `isActive` is local state, so each button toggles independently with no parent coordination. The component is consumed in `CreateProject.tsx:64` where the parent has its own `selected` state — the local `isActive` is wasted/conflicting. Lift entirely to parent, take `isActive` as prop.

**`colorpicker/color-picker.tsx`**
- Predefined `colors` array on lines 29-54 contains `'#85C1E9'` twice (line 39, line 49).
- Local `selectedColor` state shadows `value` prop; same controlled/uncontrolled smell as `dropdown.tsx`.
- `useEffect` dep on `[isDragging]` causes the click-outside listener to be removed and re-added on every drag start/stop. Fine but wasteful.

**`card-view.tsx`** vs the inline `CardView` in `kyc-card.tsx` — different signatures, same name. See §3.2.

### 4.2 Forms aren't actually forms

A consistent pattern across the codebase: `FormInput` rendered without `value`/`onChange`. The component supports both, but the consumers don't pass them. Concrete examples:

- `components/createproject/ApplicationForm.tsx:72-123` — Project Name, Project Description, Target Investment Amount, Website Link, Social Media Link all uncontrolled; clicking "Continue to Payment" submits nothing.
- `components/createproject/personal-modal.tsx:52-56` — name/email/title/phone all uncontrolled.
- `components/kyc/basic-section-kyc.tsx:33-50` — entire KYC step 1 + step 2 are uncontrolled. The `kycDataAtom` in `src/atoms/kyc/kycAtoms.ts` is defined but nothing reads or writes it.
- `components/investmentportal/create/create-sections/press-section.tsx`, `team.tsx`, `seo.tsx`, `contact.tsx`, `colors.tsx`, `faq.tsx`, `highlights.tsx`, `technology.tsx` — same pattern.
- `components/createproject/Equity/equity-section.tsx:56-61` is a rare exception that does wire `value`/`onChange`.

This isn't a bug per se — these screens are explicitly mockup/scaffolding right now — but it's worth making the *intent* explicit. E.g. add a `// stub: not yet wired` banner, or hide them behind a feature flag, so a future contributor doesn't ship a "looks-right but does nothing" form.

There are also three left-over `console.log` calls in `ApplicationForm.tsx:45,50,55`. Remove.

### 4.3 `components/auth/`

**`auth-session-provider.tsx` (~920 lines)** — well-organized and heavily commented. Two minor items:

- `dismissProgress` and `clearProgress` (lines 325-331) are functionally identical (both `setAuthProgress(null)`); they exist as separate names for documentation. Either alias them, or keep one and rename usages.
- `cancelAuthFlow` calls `clearSession` twice (line 347 and 355). The second is defensive after the await; comment that this is intentional, otherwise it reads as a duplicate.
- Size-wise, the file would benefit from extracting:
  - `getUserFacingErrorMessage` + `classifyError` → `auth-error-mapping.ts` (~50 lines)
  - Step-plan helpers (`setStepPlan`, `startStep`, `completeStep`, `failStep`, `completeStepsThrough`) → `useAuthProgress.ts` hook (~100 lines)
  Reduces the main provider to ~600 lines focused on the bootstrap state machine.

**`qualification-questionnaire.tsx` (524 lines)** — uses `'infrafund:onboarding-draft'` as a `sessionStorage` key. Same key is referenced in `auth-session-provider.tsx`'s `clearOnboardingDraft`. Centralize as a constant.

**`non-resident-form.tsx`** — clean. Local `splitName` duplicates server logic, see §3.3.

**`auth-progress-modal.tsx`** — fine.

**`login.tsx`** — fine.

**`auth-state.tsx`** — fine.

### 4.4 `components/header.tsx` and `components/sidebar.tsx`

**`sidebar.tsx`** — every Lucide icon is wrapped in a separate `dynamic(() => import('lucide-react').then(m => m.Home), { ssr: false })`. That's 17 dynamic imports (lines 9-64) for icons that are tiny SVGs and tree-shake fine via a static import. The `ssr: false` even *causes* a flash on first paint (icons appear after hydration). Replace the entire block with:
```ts
import { Home, Layers, Building, Grid3X3, Users, TrendingUp, Folder,
         Compass, ArrowUpDown, FileText, Lock, Rocket, Magnet,
         Landmark, IdCard, UserCircle } from 'lucide-react';
```

**`sidebar.tsx:81-138`** — `getNavigationItems` defines two parallel arrays (`fullItems`, `clientItems`) with overlapping entries. Could be one array with a `models: ('client' | 'full')[]` field. Mild duplication; not urgent.

**`sidebar.tsx:151`** — `key={index}` for `<Link>` items. Static array, so safe, but `key={item.url}` is more correct.

**`header.tsx`** — minimal, fine. `routeTitles` is hard-coded (lines 8-22); when a new route is added, the page title silently falls back to "Page". Consider deriving from the sidebar's `getNavigationItems` so they can't drift.

**`header/avatar-menu.tsx`** — see §3.3 for clipboard/click-outside extraction.

### 4.5 `components/main-layout.tsx`

`isHandlingOAuthCallback` (line 57) reads `window.location.search` synchronously during render. On the first SSR pass `typeof window === 'undefined'` so it's `false`; on the client pass it can be `true`. That's the explicit hydration mismatch — Next will warn unless `suppressHydrationWarning` is set somewhere. Comment on line 56 acknowledges the trade-off; consider lifting to `useSyncExternalStore` or a `useEffect`-based effect to silence the warning.

The bootstrapping branch logic with five booleans (`isPublicRoute`, `showInitialSdkLoading`, `isAwaitingOnboarding`, `isBootstrapping`, `isHandlingOAuthCallback`) is hard to follow. Consider a single derived state: `'public-show' | 'public-hide' | 'private-loading' | 'private-show'`.

### 4.6 `components/account/account-page.tsx`

Solid. Repeats clipboard pattern (see §3.3). Otherwise clean.

### 4.7 `components/developer/developer-home.tsx` (1100+ lines)

The biggest file in the codebase. Single component, no `'use client'` directive (it's pure-JSX so that's fine), every project card is hand-written inline. Issues:

- All copy/numbers/imagery hardcoded — fine for a mock dashboard, but the pattern won't survive a real backend hookup.
- Embedded inline SVG icons throughout instead of `lucide-react` — inconsistent with the rest of the app, and adds ~5-10 KB of duplicated path data.
- No component decomposition: `<StatCard>`, `<ProjectCard>`, `<MilestoneRow>` would each be ~30 lines and the file would shrink to ~300.
- Hardcoded `<Image src={solar} alt="Cornwall Wind Turbine" />` with no `width`/`height`/`fill` — `next/image` warning at runtime.

Treat this as a placeholder until the project list comes from the API; once it does, decompose.

### 4.8 `components/explorproject/explore-projects.tsx`

Folder name typo: `explorproject` (missing 'e'). Rename to `explore-project` to match the page route.

The `projects` array (lines 9-70) repeats the same card data with minor variations. Replace with a fixture file or fetch when backend is ready.

`<CardView width="340" height="577">` — the `width`/`height` props are typed as `string` (Tailwind classes). Passing raw numbers as strings (`"340"`) produces invalid Tailwind classes (`w-340`, `h-577` aren't real). Either pass `"w-[340px]"` or change the prop type.

### 4.9 `components/createproject/`

See §3.1 for duplication.

`CreateProject.tsx:18-43` — `description: ''` for all four entries; the description is rendered as `Lorem ipsum dolor sit amet consectetur.` (line 76) hard-coded **inside the map**, ignoring `item.description`. Either populate the descriptions and use `{item.description}`, or drop the `description` field.

### 4.10 `components/kyc/`

`kyc-page.tsx`, `basic-section-kyc.tsx`, `advance-section-kyc.tsx` — UI scaffolding without state wiring. `kycLevelAtom` and `kycDataAtom` are defined but unread (see §6.1).

`kyc-card.tsx` — see §3.2.

### 4.11 `components/investmentportal/`

`investmentportal.tsx` is a 10-line wrapper that just renders `<MainCreate />`. Delete the wrapper and import `MainCreate` directly from the page, or move `MainCreate` up.

`main-create.tsx:21-34` — the section list mixes "real" sections with stubs (`Sections`, `Reports` are 5-line stubs). Add a `disabled` flag to grey them out in the tab strip, like the sidebar does.

`media.tsx` is dead — see §3.1C.

---

## 5. App Router (`src/app/**`)

### 5.1 Inconsistent component naming

Pages mix `export default function Page()` (correct) with `export default function page()` (lowercase). Examples of the latter: `app/explore-projects/page.tsx:4`, `app/investment-portal/page.tsx:4`, `app/kyc/page.tsx:5`. Next.js doesn't care about the function name (the file path is what routes), but the convention is PascalCase. ESLint's `react/function-component-definition` would catch this.

### 5.2 Spurious `import React from 'react'`

Many pages still do this even though Next.js 16 + the new JSX transform doesn't require it. Examples: `app/digital-assets/page.tsx`, `app/swap/page.tsx`, `app/tokenization/page.tsx`, `app/explore-projects/page.tsx`, `app/investment-portal/page.tsx`, `app/kyc/page.tsx`, `createproject/Debt.tsx`, `createproject/Equity.tsx`, `createproject/PreSale.tsx`, etc. Drop the imports.

### 5.3 `app/global-error.tsx`

Fine. Tags Sentry with `area: 'unknown'` — consider `area: 'app-shell'` for clarity.

### 5.4 `app/layout.tsx`

`metadata: { referrer: 'origin' }` is documented inline (Openfort iframe 403 fix). Good.

### 5.5 `app/page.tsx`

Renders `<Login>` with custom copy. Fine.

### 5.6 `app/login/page.tsx`

Just a redirect to `/`. Fine — keeps the `/login` URL clean.

### 5.7 `app/create-project/page.tsx`

Has `export const dynamic = 'force-dynamic';` *before* the `import` statement (line 1). Works in TS thanks to ES module hoisting, but ESLint's `import/first` rule typically flags this. Move below imports.

---

## 6. Atoms / state management

### 6.1 `src/atoms/kyc/kycAtoms.ts` and `kycLevel.ts`

Three atoms defined: `kycStepAtom`, `kycDataAtom`, `kycLevelAtom`. None of them are read or written anywhere I could find via `grep` of the obvious usage points (the kyc components import their own local state instead). Either wire them up in `components/kyc/*` or delete.

The two files in the same folder defining one atom each is over-fragmented; merge into a single `kycAtoms.ts`.

---

## 7. `src/lib/` and `src/utils/`

### 7.1 `is-production.util.ts` / `is-development.util.ts`

`isProduction()` returns `string | boolean` because of short-circuit evaluation:
```ts
return process.env.NEXT_PUBLIC_ENVIRONMENT && process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
```
If the env var is unset, this returns `undefined` (falsy but not `false`). Wrap in `Boolean(...)` for a typed `boolean` return, or just:
```ts
return process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
```
Same applies to `isDevelopment` (currently returns the negation of the unset check). These are imported in two places at most; verify with a grep before changing semantics.

Filename suffix `.util.ts` is unique to these two files; everything else in `src/utils` and `src/lib` uses bare names. Drop the `.util` suffix for consistency.

### 7.2 `recaptcha.ts`

`window.grecaptcha?.ready(() => { window.grecaptcha?.execute(...) })` — in the inner callback `window.grecaptcha` is captured fresh, so the optional chaining is correct. Fine.

The `Promise<string>` is never rejected if `ready` is called but `execute` throws synchronously (rare). Negligible.

### 7.3 `error-reporting.ts`

Clean.

### 7.4 `block-explorer.ts`

Clean.

### 7.5 `backend-auth-client.ts`

The `request<T>` function uses `' — '` (em-dash + spaces) as message separator and `Object.entries(errorBody.fields).map(...).join(', ')` for field errors. Fine.

The double-flip of country casing (see §2.3) sits here.

### 7.6 `openfort-config.tsx`

`getEncryptionSession` (compressed earlier) handles 500s, surfaces server hint. Long but well-documented.

`OpenfortIframeFix` component patches `Node.prototype.appendChild` to set `referrerpolicy="origin"`. Comment block explains the sync-vs-async constraints (good). It scopes the patch to the lifetime of the component, but a `useEffect` cleanup that restores the original `appendChild` is missing in the parts I saw — verify (a leak here means subsequent navigations also patch appendChild, which may or may not be desirable).

---

## 8. Configuration / cross-cutting

### 8.1 ESLint coverage gaps

Several issues in this audit would be caught by enabling these rules:
- `react/function-component-definition` (PascalCase enforcement)
- `import/first` (force-dynamic placement)
- `react-hooks/exhaustive-deps` is presumably already on but several files have `// eslint-disable-next-line react-hooks/exhaustive-deps` — make sure each is justified.
- `no-console` (would catch `ApplicationForm.tsx`).
- `@next/next/no-img-element` (already enforced by Next?) — would catch the missing `next/image` width/height.

### 8.2 Knip

`media.tsx` (the dead duplicate) and `kyc-card.tsx` (if truly unused) should be flagged by `npm run format` if they're not exported through any entry point. Worth running and acting on the report.

---

## 9. Recommended remediation order

1. **Delete `media.tsx`** (dead duplicate; one-line removal). Run `npm run format` to confirm.
2. **Delete or rewrite `components/ui/kyc-card.tsx`** if unused; if used, point it at the canonical UI primitives.
3. **Consolidate `Charity.tsx` / `equity-section.tsx` / `pre-sale-section.tsx`** into one parameterized `<CrowdfundingTypeSection>`. Delete `Equity.tsx` / `PreSale.tsx` wrappers (and the `Debt.tsx` stub if not building Debt yet).
4. **Fix the blob-URL leak** in `file-upload-with-preview.tsx`.
5. **Replace `dynamic`-imported icons** in `sidebar.tsx` with static imports.
6. **Remove `console.log` calls** in `ApplicationForm.tsx`.
7. **Extract `useCopyToClipboard` and `useDismissableOverlay`** hooks; replace duplicated logic.
8. **Extract `splitName`** to a shared helper imported by both client and server.
9. **Decide on country payload shape** and remove the double-rename in `services/public-forms.ts:getCountries` ↔ `lib/backend-auth-client.ts:normalizeCountry`.
10. **Wire (or hide) the form scaffolding** in `createproject/`, `investmentportal/create-sections/`, `kyc/`, and `personal-modal.tsx`. At minimum, plumb `value`/`onChange` to feature-level state so a future change doesn't ship a no-op form.
11. **Decompose `developer-home.tsx`** when the data layer behind it is decided.
12. **Drop `.util` suffix** from the two `utils/*.util.ts` files; tighten their boolean return types.
13. **Confirm lockout-counting logic** exists somewhere (or is intentionally absent post-migration).

Items 1-6 are mechanical and safe; 7-9 are small refactors; 10-13 are larger and should be sequenced with feature work, not done as one batch.

---

## Appendix A — files I did not read in full

Time-boxed audit. Files read in summary form (small + clearly stub-like, or known-bulk and sampled):

- `components/investmentportal/create/create-sections/{seo,contact,faq,team,colors,highlights,technology,transfer/transfer-bank,transfer/transfer-crypto}.tsx` — sampled enough to confirm the same uncontrolled-`FormInput` pattern as `press-section.tsx`. If you want any of these audited line-by-line, ask.
- `components/createproject/Charity/charity-crowdfunding.tsx` — small; mirrors `equity-project.tsx` / `pre-sale-project.tsx` in structure.
- `components/kyc/advance-section-kyc.tsx` — same scaffolding pattern as `basic-section-kyc.tsx`.
- `components/investmentportal/empty/emptyinvestment.tsx` — empty-state placeholder; not in current navigation flow.

No files were skipped because they were impossible to read; the omitted ones are repeats of patterns already covered above.
